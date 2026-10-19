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
            INSERT INTO products (category_id, brand_id, product_name, description, unit_type, unit_price, current_stock, min_stock_level, image_url, is_featured, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        """;
        return jdbcTemplate.update(sql, 
                p.getCategoryId(), p.getBrandId(), p.getProductName(), p.getDescription(), 
                p.getUnitType(), p.getUnitPrice(), p.getCurrentStock(), p.getMinStockLevel(), 
                p.getImageUrl(), p.getIsFeatured());
    }

    /**
     * Update product details (Trigger trg_before_product_price_audit automatically logs price changes)
     */
    public int updateProduct(Product p) {
        String sql = """
            UPDATE products 
            SET category_id = ?, brand_id = ?, product_name = ?, description = ?, unit_type = ?, unit_price = ?, min_stock_level = ?, image_url = ?, is_featured = ?, is_active = ?
            WHERE product_id = ?
        """;
        return jdbcTemplate.update(sql,
                p.getCategoryId(), p.getBrandId(), p.getProductName(), p.getDescription(),
                p.getUnitType(), p.getUnitPrice(), p.getMinStockLevel(), p.getImageUrl(),
                p.getIsFeatured(), p.getIsActive(), p.getProductId());
    }

    public int deleteProduct(int productId) {
        String sql = "UPDATE products SET is_active = FALSE WHERE product_id = ?";
        return jdbcTemplate.update(sql, productId);
    }

    public List<Category> getAllCategories() {
        String sql = "SELECT * FROM categories WHERE is_active = TRUE ORDER BY category_name ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Category c = new Category();
            c.setCategoryId(rs.getInt("category_id"));
            c.setCategoryName(rs.getString("category_name"));
            c.setDescription(rs.getString("description"));
            c.setImageUrl(rs.getString("image_url"));
            c.setIsActive(rs.getBoolean("is_active"));
            return c;
        });
    }

    public List<Brand> getAllBrands() {
        String sql = "SELECT * FROM brands ORDER BY brand_name ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Brand b = new Brand();
            b.setBrandId(rs.getInt("brand_id"));
            b.setBrandName(rs.getString("brand_name"));
            b.setDescription(rs.getString("description"));
            b.setLogoUrl(rs.getString("logo_url"));
            return b;
        });
    }
}
