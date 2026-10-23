package com.supermart.backend.dao;

import com.supermart.backend.model.Brand;
import com.supermart.backend.model.Category;
import com.supermart.backend.model.Product;
import com.supermart.backend.model.StockAlert;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pure JDBC Data Access Object for Products, Categories, Brands & Stock
 * Connects directly to Views: v_active_product_catalog, v_low_stock_alerts
 * and Stored Procedure: sp_restock_product
 */
@Repository
public class ProductDao {

    private final JdbcTemplate jdbcTemplate;

    public ProductDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Product> productCatalogRowMapper = (rs, rowNum) -> {
        Product p = new Product();
        p.setProductId(rs.getInt("product_id"));
        p.setProductName(rs.getString("product_name"));
        p.setDescription(rs.getString("description"));
        p.setUnitType(rs.getString("unit_type"));
        p.setBasePrice(rs.getBigDecimal("base_price"));
        p.setUnitPrice(rs.getBigDecimal("unit_price"));
        p.setCurrentStock(rs.getInt("current_stock"));
        p.setStockStatus(rs.getString("stock_status"));
        p.setImageUrl(rs.getString("image_url"));
        p.setIsFeatured(rs.getBoolean("is_featured"));
        p.setCategoryId(rs.getInt("category_id"));
        p.setCategoryName(rs.getString("category_name"));
        p.setBrandId(rs.getInt("brand_id"));
        p.setBrandName(rs.getString("brand_name"));
        return p;
    };

    /**
     * Get active products from View: v_active_product_catalog
     */
    public List<Product> getAllActiveProducts() {
        String sql = "SELECT * FROM v_active_product_catalog ORDER BY is_featured DESC, product_id ASC";
        return jdbcTemplate.query(sql, productCatalogRowMapper);
    }

    /**
     * Search products with optional category and brand filter
     */
    public List<Product> searchProducts(String query, Integer categoryId, Integer brandId) {
        StringBuilder sql = new StringBuilder("SELECT * FROM v_active_product_catalog WHERE 1=1");
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(product_name) LIKE LOWER('%").append(query.trim()).append("%')")
               .append(" OR LOWER(brand_name) LIKE LOWER('%").append(query.trim()).append("%'))");
        }
        if (categoryId != null && categoryId > 0) {
            sql.append(" AND category_id = ").append(categoryId);
        }
        if (brandId != null && brandId > 0) {
            sql.append(" AND brand_id = ").append(brandId);
        }
        sql.append(" ORDER BY is_featured DESC, product_id ASC");
        return jdbcTemplate.query(sql.toString(), productCatalogRowMapper);
    }

    public Optional<Product> getProductById(int productId) {
        String sql = "SELECT * FROM v_active_product_catalog WHERE product_id = ?";
        List<Product> list = jdbcTemplate.query(sql, productCatalogRowMapper, productId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /**
     * Operational Manager & Admin Low Stock Alerts from View: v_low_stock_alerts
     */
    public List<Map<String, Object>> getLowStockAlerts() {
        String sql = "SELECT * FROM v_low_stock_alerts ORDER BY units_needed DESC";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Restock Product using Stored Procedure: sp_restock_product
     */
    public Map<String, Object> restockProduct(int userId, int productId, int additionalStock) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_restock_product")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.INTEGER),
                        new SqlParameter("p_product_id", Types.INTEGER),
                        new SqlParameter("p_additional_stock", Types.INTEGER),
                        new SqlOutParameter("p_new_stock", Types.INTEGER),
                        new SqlOutParameter("p_msg", Types.VARCHAR)
                );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_user_id", userId);
        inParams.put("p_product_id", productId);
        inParams.put("p_additional_stock", additionalStock);

        return call.execute(inParams);
    }

    /**
     * Insert new product
     */
    public int addProduct(Product p) {
        String sql = """
            INSERT INTO products (category_id, brand_id, product_name, description, unit_type, base_price, unit_price, current_stock, min_stock_level, image_url, is_featured, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        """;
        java.math.BigDecimal basePrice = p.getBasePrice() != null ? p.getBasePrice() : java.math.BigDecimal.ZERO;
        return jdbcTemplate.update(sql, 
                p.getCategoryId(), p.getBrandId(), p.getProductName(), p.getDescription(), 
                p.getUnitType(), basePrice, p.getUnitPrice(), p.getCurrentStock(), p.getMinStockLevel(), 
                p.getImageUrl(), p.getIsFeatured());
    }

    /**
     * Update product details (Trigger trg_before_product_price_audit automatically logs price changes)
     */
    public int updateProduct(Product p) {
        String sql = """
            UPDATE products 
            SET category_id = COALESCE(?, category_id),
                brand_id = COALESCE(?, brand_id),
                product_name = COALESCE(?, product_name),
                description = COALESCE(?, description),
                unit_type = COALESCE(?, unit_type),
                base_price = ?,
                unit_price = ?,
                min_stock_level = COALESCE(?, min_stock_level, 10),
                image_url = COALESCE(?, image_url),
                is_featured = COALESCE(?, is_featured, FALSE),
                is_active = COALESCE(?, is_active, TRUE)
            WHERE product_id = ?
        """;
        java.math.BigDecimal basePrice = p.getBasePrice() != null ? p.getBasePrice() : java.math.BigDecimal.ZERO;
        return jdbcTemplate.update(sql,
                p.getCategoryId(), p.getBrandId(), p.getProductName(), p.getDescription(),
                p.getUnitType(), basePrice, p.getUnitPrice(), p.getMinStockLevel(), p.getImageUrl(),
                p.getIsFeatured(), p.getIsActive(), p.getProductId());
    }

    public int deleteProduct(int productId) {
        String sql = "UPDATE products SET is_active = FALSE WHERE product_id = ?";
        return jdbcTemplate.update(sql, productId);
    }

    public List<Category> getAllCategories(boolean all) {
        StringBuilder sql = new StringBuilder("""
            SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.category_id AND p.is_active = TRUE) AS product_count
            FROM categories c
        """);
        if (!all) {
            sql.append(" WHERE c.is_active = TRUE");
        }
        sql.append(" ORDER BY c.category_name ASC");
        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            Category c = new Category();
            c.setCategoryId(rs.getInt("category_id"));
            c.setCategoryName(rs.getString("category_name"));
            c.setDescription(rs.getString("description"));
            c.setImageUrl(rs.getString("image_url"));
            c.setIsActive(rs.getBoolean("is_active"));
            c.setProductCount(rs.getInt("product_count"));
            return c;
        });
    }

    public List<Category> getAllCategories() {
        return getAllCategories(false);
    }

    public int addCategory(Category c) {
        String sql = "INSERT INTO categories (category_name, description, image_url, is_active) VALUES (?, ?, ?, TRUE)";
        return jdbcTemplate.update(sql, c.getCategoryName(), c.getDescription(), c.getImageUrl());
    }

    public int updateCategory(Category c) {
        String sql = "UPDATE categories SET category_name = ?, description = ?, image_url = ?, is_active = ? WHERE category_id = ?";
        return jdbcTemplate.update(sql, c.getCategoryName(), c.getDescription(), c.getImageUrl(), 
                c.getIsActive() != null ? c.getIsActive() : true, c.getCategoryId());
    }

    public int toggleCategory(int categoryId, boolean active) {
        String sql = "UPDATE categories SET is_active = ? WHERE category_id = ?";
        return jdbcTemplate.update(sql, active, categoryId);
    }

    public boolean deleteCategory(int categoryId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE category_id = ? AND is_active = TRUE", Integer.class, categoryId);
        if (count != null && count > 0) {
            jdbcTemplate.update("UPDATE categories SET is_active = FALSE WHERE category_id = ?", categoryId);
        } else {
            jdbcTemplate.update("DELETE FROM categories WHERE category_id = ?", categoryId);
        }
        return true;
    }

    public List<Brand> getAllBrands(boolean all) {
        StringBuilder sql = new StringBuilder("""
            SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.brand_id AND p.is_active = TRUE) AS product_count
            FROM brands b
        """);
        if (!all) {
            sql.append(" WHERE b.is_active = TRUE");
        }
        sql.append(" ORDER BY b.brand_name ASC");
        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            Brand b = new Brand();
            b.setBrandId(rs.getInt("brand_id"));
            b.setBrandName(rs.getString("brand_name"));
            b.setDescription(rs.getString("description"));
            b.setLogoUrl(rs.getString("logo_url"));
            b.setIsActive(rs.getBoolean("is_active"));
            b.setProductCount(rs.getInt("product_count"));
            return b;
        });
    }

    public List<Brand> getAllBrands() {
        return getAllBrands(false);
    }

    public int addBrand(Brand b) {
        String sql = "INSERT INTO brands (brand_name, description, logo_url, is_active) VALUES (?, ?, ?, TRUE)";
        return jdbcTemplate.update(sql, b.getBrandName(), b.getDescription(), b.getLogoUrl());
    }

    public int updateBrand(Brand b) {
        String sql = "UPDATE brands SET brand_name = ?, description = ?, logo_url = ?, is_active = ? WHERE brand_id = ?";
        return jdbcTemplate.update(sql, b.getBrandName(), b.getDescription(), b.getLogoUrl(), 
                b.getIsActive() != null ? b.getIsActive() : true, b.getBrandId());
    }

    public int toggleBrand(int brandId, boolean active) {
        String sql = "UPDATE brands SET is_active = ? WHERE brand_id = ?";
        return jdbcTemplate.update(sql, active, brandId);
    }

    public boolean deleteBrand(int brandId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE brand_id = ? AND is_active = TRUE", Integer.class, brandId);
        if (count != null && count > 0) {
            jdbcTemplate.update("UPDATE brands SET is_active = FALSE WHERE brand_id = ?", brandId);
        } else {
            jdbcTemplate.update("DELETE FROM brands WHERE brand_id = ?", brandId);
        }
        return true;
    }
}
