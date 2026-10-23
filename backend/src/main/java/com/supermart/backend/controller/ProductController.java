package com.supermart.backend.controller;

import com.supermart.backend.dao.ProductDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.RestockRequest;
import com.supermart.backend.model.Brand;
import com.supermart.backend.model.Category;
import com.supermart.backend.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductDao productDao;

    public ProductController(ProductDao productDao) {
        this.productDao = productDao;
    }

    /**
     * Get active products from View: v_active_product_catalog
     * Supports filtering by query, category, and brand
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId) {

        List<Product> products;
        if ((query != null && !query.isBlank()) || (categoryId != null && categoryId > 0) || (brandId != null && brandId > 0)) {
            products = productDao.searchProducts(query, categoryId, brandId);
        } else {
            products = productDao.getAllActiveProducts();
        }
        return ResponseEntity.ok(ApiResponse.ok("Products loaded", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable int id) {
        return productDao.getProductById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.ok("Product found", product)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Add new product (Operational Manager / Admin)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> addProduct(@RequestBody Product product) {
        productDao.addProduct(product);
        return ResponseEntity.ok(ApiResponse.ok("Product added successfully"));
    }

    /**
     * Update product details & pricing (DB trigger trg_before_product_price_audit logs price updates automatically)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> updateProduct(@PathVariable int id, @RequestBody Product product) {
        product.setProductId(id);
        productDao.updateProduct(product);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable int id) {
        productDao.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Product deactivated"));
    }

    /**
     * Low stock alerts from View: v_low_stock_alerts (For Operational Managers & Admin)
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLowStockAlerts() {
        List<Map<String, Object>> alerts = productDao.getLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.ok("Low stock alerts loaded", alerts));
    }

    /**
     * Restock Product via Stored Procedure: sp_restock_product
     */
    @PostMapping("/restock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restock(@RequestBody RestockRequest req) {
        if (req.getAdditionalStock() == null || req.getAdditionalStock() <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Restock quantity must be greater than 0"));
        }
        Map<String, Object> result = productDao.restockProduct(req.getUserId(), req.getProductId(), req.getAdditionalStock());
        Integer newStock = (Integer) result.get("p_new_stock");
        String message = (String) result.get("p_msg");

        if (newStock != null && newStock >= 0) {
            return ResponseEntity.ok(ApiResponse.ok(message, result));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(message));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories(
            @RequestParam(required = false, defaultValue = "false") boolean all) {
        return ResponseEntity.ok(ApiResponse.ok("Categories loaded", productDao.getAllCategories(all)));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<String>> addCategory(@RequestBody Category category) {
        if (category.getCategoryName() == null || category.getCategoryName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Category name is required"));
        }
        productDao.addCategory(category);
        return ResponseEntity.ok(ApiResponse.ok("Category added successfully"));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<String>> updateCategory(@PathVariable int id, @RequestBody Category category) {
        category.setCategoryId(id);
        productDao.updateCategory(category);
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully"));
    }

    @PatchMapping("/categories/{id}/toggle")
    public ResponseEntity<ApiResponse<String>> toggleCategory(@PathVariable int id, @RequestParam boolean active) {
        productDao.toggleCategory(id, active);
        String msg = active ? "Category enabled successfully" : "Category hidden successfully";
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable int id) {
        try {
            productDao.deleteCategory(id);
            return ResponseEntity.ok(ApiResponse.ok("Category removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot delete category: " + e.getMessage()));
        }
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<Brand>>> getBrands(
            @RequestParam(required = false, defaultValue = "false") boolean all) {
        return ResponseEntity.ok(ApiResponse.ok("Brands loaded", productDao.getAllBrands(all)));
    }

    @PostMapping("/brands")
    public ResponseEntity<ApiResponse<String>> addBrand(@RequestBody Brand brand) {
        if (brand.getBrandName() == null || brand.getBrandName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Brand name is required"));
        }
        productDao.addBrand(brand);
        return ResponseEntity.ok(ApiResponse.ok("Brand added successfully"));
    }

    @PutMapping("/brands/{id}")
    public ResponseEntity<ApiResponse<String>> updateBrand(@PathVariable int id, @RequestBody Brand brand) {
        brand.setBrandId(id);
        productDao.updateBrand(brand);
        return ResponseEntity.ok(ApiResponse.ok("Brand updated successfully"));
    }

    @PatchMapping("/brands/{id}/toggle")
    public ResponseEntity<ApiResponse<String>> toggleBrand(@PathVariable int id, @RequestParam boolean active) {
        productDao.toggleBrand(id, active);
        String msg = active ? "Brand enabled successfully" : "Brand hidden successfully";
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<ApiResponse<String>> deleteBrand(@PathVariable int id) {
        try {
            productDao.deleteBrand(id);
            return ResponseEntity.ok(ApiResponse.ok("Brand removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
