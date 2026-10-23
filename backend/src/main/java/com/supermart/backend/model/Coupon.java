package com.supermart.backend.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Coupon {
    private Integer couponId;
    private String couponCode;
    private String description;
    private BigDecimal minOrderAmount;
    private BigDecimal discountPercentage;
    private Boolean freeDelivery;
    private Timestamp validFrom;
    private Timestamp validUntil;
    private Boolean isActive;

    public Coupon() {}

    public Integer getCouponId() { return couponId; }
    public void setCouponId(Integer couponId) { this.couponId = couponId; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(BigDecimal minOrderAmount) { this.minOrderAmount = minOrderAmount; }

    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }

    public Boolean getFreeDelivery() { return freeDelivery; }
    public void setFreeDelivery(Boolean freeDelivery) { this.freeDelivery = freeDelivery; }

    public Timestamp getValidFrom() { return validFrom; }
    public void setValidFrom(Timestamp validFrom) { this.validFrom = validFrom; }

    public Timestamp getValidUntil() { return validUntil; }
    public void setValidUntil(Timestamp validUntil) { this.validUntil = validUntil; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
