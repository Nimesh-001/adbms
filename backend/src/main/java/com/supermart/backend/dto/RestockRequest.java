package com.supermart.backend.dto;

public class RestockRequest {
    private Integer userId;
    private Integer productId;
    private Integer additionalStock;

    public RestockRequest() {}

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getAdditionalStock() { return additionalStock; }
    public void setAdditionalStock(Integer additionalStock) { this.additionalStock = additionalStock; }
}
