package com.supermart.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutRequest {
    private Integer userId;
    private Integer addressId;
    private String couponCode;
    private String paymentMethod; // 'CASH_ON_DELIVERY' or 'CARD_PAYMENT'
    private BigDecimal subtotal;
    private List<CheckoutItemDto> items;

    public CheckoutRequest() {}

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getAddressId() { return addressId; }
    public void setAddressId(Integer addressId) { this.addressId = addressId; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public List<CheckoutItemDto> getItems() { return items; }
    public void setItems(List<CheckoutItemDto> items) { this.items = items; }
}
