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
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok("Categories loaded", productDao.getAllCategories()));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<Brand>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.ok("Brands loaded", productDao.getAllBrands()));
    }
}
