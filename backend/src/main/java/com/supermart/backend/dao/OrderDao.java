package com.supermart.backend.dao;

import com.supermart.backend.dto.CheckoutItemDto;
import com.supermart.backend.dto.CheckoutRequest;
import com.supermart.backend.model.Order;
import com.supermart.backend.model.OrderItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pure JDBC Data Access Object for Orders and Checkout
 * Executes ACID Transactions, calls Stored Procedure sp_place_order_transaction,
 * and reads from View v_customer_order_history.
 */
@Repository
public class OrderDao {

    private final JdbcTemplate jdbcTemplate;

    public OrderDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Order> orderSummaryRowMapper = (rs, rowNum) -> {
        Order o = new Order();
        o.setOrderId(rs.getInt("order_id"));
        o.setOrderNumber(rs.getString("order_number"));
        o.setUserId(rs.getInt("user_id"));
        o.setCustomerName(rs.getString("customer_name"));
        o.setEmail(rs.getString("email"));
        o.setMobilePhone(rs.getString("mobile_phone"));
        o.setSubtotal(rs.getBigDecimal("subtotal"));
        o.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        o.setDeliveryCharge(rs.getBigDecimal("delivery_charge"));
        o.setTotalAmount(rs.getBigDecimal("total_amount"));
        o.setOrderStatus(rs.getString("order_status"));
        o.setPaymentMethod(rs.getString("payment_method"));
        o.setPaymentStatus(rs.getString("payment_status"));
        o.setOrderDate(rs.getTimestamp("order_date"));
        return o;
    };

    /**
     * ACID Transactional Order Placement:
     * 1. Invokes MySQL Stored Procedure: sp_place_order_transaction
     * 2. Inserts Order Items (which automatically triggers inventory deduction via DB trigger)
     */
    @Transactional
    public Map<String, Object> placeOrder(CheckoutRequest req) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_place_order_transaction")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.INTEGER),
                        new SqlParameter("p_address_id", Types.INTEGER),
                        new SqlParameter("p_coupon_code", Types.VARCHAR),
                        new SqlParameter("p_payment_method", Types.VARCHAR),
                        new SqlParameter("p_subtotal", Types.DECIMAL),
                        new SqlOutParameter("p_order_id", Types.INTEGER),
                        new SqlOutParameter("p_order_number", Types.VARCHAR),
                        new SqlOutParameter("p_status_msg", Types.VARCHAR)
                );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_user_id", req.getUserId());
        inParams.put("p_address_id", req.getAddressId());
        inParams.put("p_coupon_code", req.getCouponCode());
        inParams.put("p_payment_method", req.getPaymentMethod());
        inParams.put("p_subtotal", req.getSubtotal());

        Map<String, Object> out = call.execute(inParams);
        Integer orderId = (Integer) out.get("p_order_id");

        if (orderId != null && orderId > 0 && req.getItems() != null) {
            String insertItemSql = """
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, base_price, item_total)
                VALUES (?, ?, ?, ?, ?, ?)
            """;
            for (CheckoutItemDto item : req.getItems()) {
                BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                BigDecimal basePrice = BigDecimal.ZERO;
                try {
                    BigDecimal bp = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(base_price, 0.00) FROM products WHERE product_id = ?",
                        BigDecimal.class,
                        item.getProductId()
                    );
                    if (bp != null) {
                        basePrice = bp;
                    }
                } catch (Exception ignored) {
                    basePrice = BigDecimal.ZERO;
                }
                // Triggers trg_after_order_item_insert_deduct_stock and trg_before_product_stock_check fire automatically here!
                jdbcTemplate.update(insertItemSql, orderId, item.getProductId(), item.getQuantity(), item.getUnitPrice(), basePrice, itemTotal);
            }
        }

        return out;
    }

    /**
     * Read from View: v_customer_order_history
     */
    public List<Order> getOrdersByUserId(int userId) {
        String sql = "SELECT * FROM v_customer_order_history WHERE user_id = ? ORDER BY order_id DESC";
        return jdbcTemplate.query(sql, orderSummaryRowMapper, userId);
    }

    public List<Order> getAllOrders() {
        String sql = "SELECT * FROM v_customer_order_history ORDER BY order_id DESC";
        return jdbcTemplate.query(sql, orderSummaryRowMapper);
    }

    public Optional<Order> getOrderById(int orderId) {
        String sql = "SELECT * FROM v_customer_order_history WHERE order_id = ?";
        List<Order> list = jdbcTemplate.query(sql, orderSummaryRowMapper, orderId);
        if (list.isEmpty()) {
            return Optional.empty();
        }
        Order order = list.get(0);
        order.setItems(getOrderItems(orderId));
        return Optional.of(order);
    }

    public List<OrderItem> getOrderItems(int orderId) {
        String sql = """
            SELECT oi.*, p.product_name, p.unit_type, p.image_url 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            OrderItem item = new OrderItem();
            item.setOrderItemId(rs.getInt("order_item_id"));
            item.setOrderId(rs.getInt("order_id"));
            item.setProductId(rs.getInt("product_id"));
            item.setProductName(rs.getString("product_name"));
            item.setUnitType(rs.getString("unit_type"));
            item.setImageUrl(rs.getString("image_url"));
            item.setQuantity(rs.getInt("quantity"));
            item.setUnitPrice(rs.getBigDecimal("unit_price"));
            item.setBasePrice(rs.getBigDecimal("base_price"));
            item.setItemTotal(rs.getBigDecimal("item_total"));
            return item;
        }, orderId);
    }

    /**
     * Update order status (Triggers trg_after_order_status_update_audit automatically)
     */
    public int updateOrderStatus(int orderId, String newStatus) {
        String sql = "UPDATE orders SET order_status = ? WHERE order_id = ?";
        return jdbcTemplate.update(sql, newStatus, orderId);
    }
}
