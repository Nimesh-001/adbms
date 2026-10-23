package com.supermart.backend.dao;

import com.supermart.backend.model.Coupon;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CouponDao {

    private final JdbcTemplate jdbcTemplate;

    public CouponDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Coupon> couponRowMapper = (rs, rowNum) -> {
        Coupon c = new Coupon();
        c.setCouponId(rs.getInt("coupon_id"));
        c.setCouponCode(rs.getString("coupon_code"));
        c.setDescription(rs.getString("description"));
        c.setMinOrderAmount(rs.getBigDecimal("min_order_amount"));
        c.setDiscountPercentage(rs.getBigDecimal("discount_percentage"));
        c.setFreeDelivery(rs.getBoolean("free_delivery"));
        c.setValidFrom(rs.getTimestamp("valid_from"));
        c.setValidUntil(rs.getTimestamp("valid_until"));
        try {
            c.setIsActive(rs.getBoolean("is_active"));
        } catch (Exception ignored) {
            c.setIsActive(true);
        }
        return c;
    };

    /**
     * Get active coupons from View: v_active_coupons
     */
    public List<Coupon> getActiveCoupons() {
        String sql = "SELECT * FROM v_active_coupons ORDER BY min_order_amount ASC";
        return jdbcTemplate.query(sql, couponRowMapper);
    }

    public List<Coupon> getAllCoupons() {
        String sql = "SELECT * FROM coupons ORDER BY coupon_id DESC";
        return jdbcTemplate.query(sql, couponRowMapper);
    }

    public Optional<Coupon> findByCode(String code) {
        String sql = "SELECT * FROM coupons WHERE coupon_code = ? AND is_active = TRUE AND NOW() BETWEEN valid_from AND valid_until LIMIT 1";
        List<Coupon> list = jdbcTemplate.query(sql, couponRowMapper, code);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public int createCoupon(Coupon c) {
        String sql = """
            INSERT INTO coupons (coupon_code, description, min_order_amount, discount_percentage, free_delivery, valid_from, valid_until, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        """;
        return jdbcTemplate.update(sql, 
                c.getCouponCode(), c.getDescription(), c.getMinOrderAmount(), 
                c.getDiscountPercentage(), c.getFreeDelivery(), c.getValidFrom(), c.getValidUntil());
    }

    public int toggleCouponStatus(int couponId, boolean isActive) {
        String sql = "UPDATE coupons SET is_active = ? WHERE coupon_id = ?";
        return jdbcTemplate.update(sql, isActive, couponId);
    }

    public int updateCoupon(Coupon c) {
        String sql = """
            UPDATE coupons
            SET coupon_code = ?,
                description = ?,
                min_order_amount = ?,
                discount_percentage = ?,
                free_delivery = ?
            WHERE coupon_id = ?
        """;
        return jdbcTemplate.update(sql,
                c.getCouponCode(), c.getDescription(), c.getMinOrderAmount(),
                c.getDiscountPercentage(), c.getFreeDelivery(), c.getCouponId());
    }
}
