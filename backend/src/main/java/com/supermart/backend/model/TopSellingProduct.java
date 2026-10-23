package com.supermart.backend.model;

import java.math.BigDecimal;

public class TopSellingProduct {
    private Integer productId;
    private String productName;
    private String categoryName;
    private String brandName;
    private Integer totalQuantitySold;
    private BigDecimal totalSalesRevenue;
    private BigDecimal totalProfit;

    public TopSellingProduct() {}

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public Integer getTotalQuantitySold() { return totalQuantitySold; }
    public void setTotalQuantitySold(Integer totalQuantitySold) { this.totalQuantitySold = totalQuantitySold; }

    public BigDecimal getTotalSalesRevenue() { return totalSalesRevenue; }
    public void setTotalSalesRevenue(BigDecimal totalSalesRevenue) { this.totalSalesRevenue = totalSalesRevenue; }

    public BigDecimal getTotalProfit() { return totalProfit; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }
}
