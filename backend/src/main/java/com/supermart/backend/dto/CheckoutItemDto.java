package com.supermart.backend.dto;

import java.math.BigDecimal;

public class CheckoutItemDto {
    private Integer productId;
    private Integer quantity;
    private BigDecimal unitPrice;

    public CheckoutItemDto() {}

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
