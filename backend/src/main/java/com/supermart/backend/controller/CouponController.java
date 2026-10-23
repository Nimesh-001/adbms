package com.supermart.backend.controller;

import com.supermart.backend.dao.CouponDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.model.Coupon;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponDao couponDao;

    public CouponController(CouponDao couponDao) {
        this.couponDao = couponDao;
    }

    /**
     * Active Coupons from View: v_active_coupons (Displayed in the Customer Checkout Modal)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Coupon>>> getActiveCoupons() {
        return ResponseEntity.ok(ApiResponse.ok("Active coupons loaded", couponDao.getActiveCoupons()));
    }

    /**
     * All Coupons for Operational Manager & Admin
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Coupon>>> getAllCoupons() {
        return ResponseEntity.ok(ApiResponse.ok("All coupons loaded", couponDao.getAllCoupons()));
    }

    /**
     * Validate and Apply Coupon code against order subtotal
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal subtotal) {

        Optional<Coupon> couponOpt = couponDao.findByCode(code.trim().toUpperCase());
        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired coupon code"));
        }

        Coupon coupon = couponOpt.get();

        if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Order subtotal must be at least LKR " + coupon.getMinOrderAmount() + " to use this coupon"));
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (coupon.getDiscountPercentage() != null && coupon.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = subtotal.multiply(coupon.getDiscountPercentage()).divide(BigDecimal.valueOf(100));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("couponId", coupon.getCouponId());
        data.put("couponCode", coupon.getCouponCode());
        data.put("discountAmount", discountAmount);
        data.put("freeDelivery", coupon.getFreeDelivery());
        data.put("description", coupon.getDescription());

        return ResponseEntity.ok(ApiResponse.ok("Coupon applied successfully!", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> createCoupon(@RequestBody Coupon coupon) {
        couponDao.createCoupon(coupon);
        return ResponseEntity.ok(ApiResponse.ok("Coupon created successfully"));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<String>> toggleCoupon(@PathVariable int id, @RequestParam boolean active) {
        couponDao.toggleCouponStatus(id, active);
        return ResponseEntity.ok(ApiResponse.ok("Coupon status updated"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> updateCoupon(@PathVariable int id, @RequestBody Coupon coupon) {
        coupon.setCouponId(id);
        couponDao.updateCoupon(coupon);
        return ResponseEntity.ok(ApiResponse.ok("Coupon updated successfully"));
    }
}
