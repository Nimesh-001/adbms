package com.supermart.backend.model;

import java.math.BigDecimal;

/**
 * Product Entity - Mapped from products table & v_active_product_catalog view
 */
public class Product {
    private Integer productId;
    private Integer categoryId;
    private String categoryName;
    private Integer brandId;
    private String brandName;
    private String productName;
    private String description;
    private String unitType;     // '100g' or 'unit'
    private BigDecimal basePrice;
    private BigDecimal unitPrice;
    private Integer currentStock;
    private Integer minStockLevel;
    private String stockStatus;   // 'In Stock' or 'Out of Stock'
    private String imageUrl;
    private Boolean isFeatured;
    private Boolean isActive;

    public Product() {}

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getBrandId() { return brandId; }
    public void setBrandId(Integer brandId) { this.brandId = brandId; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUnitType() { return unitType; }
    public void setUnitType(String unitType) { this.unitType = unitType; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }

    public Integer getMinStockLevel() { return minStockLevel; }
    public void setMinStockLevel(Integer minStockLevel) { this.minStockLevel = minStockLevel; }

    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
