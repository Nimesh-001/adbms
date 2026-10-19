package com.supermart.backend.dao;

import com.supermart.backend.model.AuditLog;
import com.supermart.backend.model.DailySalesSummary;
import com.supermart.backend.model.TopSellingProduct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Pure JDBC Data Access Object for Admin Analytics & Audit Logs
 * Direct integration with Views: v_daily_sales_summary, v_top_selling_products
 * and Stored Procedure: sp_generate_monthly_report
 */
@Repository
public class AnalyticsDao {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Read from View: v_daily_sales_summary
     */
    public List<DailySalesSummary> getDailySalesSummary() {
        String sql = "SELECT * FROM v_daily_sales_summary ORDER BY sales_date DESC LIMIT 30";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DailySalesSummary d = new DailySalesSummary();
            d.setSalesDate(rs.getDate("sales_date"));
            d.setTotalOrders(rs.getInt("total_orders"));
            d.setGrossSubtotal(rs.getBigDecimal("gross_subtotal"));
            d.setTotalDiscountsGiven(rs.getBigDecimal("total_discounts_given"));
            d.setTotalDeliveryCollected(rs.getBigDecimal("total_delivery_collected"));
            d.setTotalRevenue(rs.getBigDecimal("total_revenue"));
            return d;
        });
    }

    /**
     * Read from View: v_top_selling_products
     */
    public List<TopSellingProduct> getTopSellingProducts() {
        String sql = "SELECT * FROM v_top_selling_products LIMIT 10";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            TopSellingProduct t = new TopSellingProduct();
            t.setProductId(rs.getInt("product_id"));
            t.setProductName(rs.getString("product_name"));
            t.setCategoryName(rs.getString("category_name"));
            t.setBrandName(rs.getString("brand_name"));
            t.setTotalQuantitySold(rs.getInt("total_quantity_sold"));
            t.setTotalSalesRevenue(rs.getBigDecimal("total_sales_revenue"));
            return t;
        });
    }

    /**
     * Read from Table: audit_logs (Using index idx_audit_created)
     */
    public List<AuditLog> getRecentAuditLogs(int limit) {
        String sql = "SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            AuditLog log = new AuditLog();
            log.setLogId(rs.getInt("log_id"));
            log.setUserId(rs.getObject("user_id", Integer.class));
            log.setActionType(rs.getString("action_type"));
            log.setTableName(rs.getString("table_name"));
            log.setRecordId(rs.getObject("record_id", Integer.class));
            log.setDetails(rs.getString("details"));
            log.setCreatedAt(rs.getTimestamp("created_at"));
            return log;
        }, limit);
    }

    /**
     * Call Stored Procedure: sp_generate_monthly_report
     */
    public List<Map<String, Object>> getMonthlyReport(int year, int month) {
        String sql = "CALL sp_generate_monthly_report(?, ?)";
        return jdbcTemplate.queryForList(sql, year, month);
    }

    /**
     * Call Stored Function: fn_customer_lifetime_spending
     */
    public BigDecimal getCustomerLifetimeSpending(int userId) {
        String sql = "SELECT fn_customer_lifetime_spending(?) AS lifetime_spent";
        return jdbcTemplate.queryForObject(sql, BigDecimal.class, userId);
    }

    /**
     * Overall KPI metrics for Super Admin Dashboard
     */
    public Map<String, Object> getOverallKpis() {
        String sql = """
            SELECT 
                (SELECT COUNT(*) FROM orders WHERE order_status != 'CANCELLED') AS total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status != 'CANCELLED') AS total_revenue,
                (SELECT COUNT(*) FROM users WHERE role_id = 3) AS total_customers,
                (SELECT COUNT(*) FROM users WHERE role_id = 2) AS total_managers,
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
                (SELECT COUNT(*) FROM v_low_stock_alerts) AS low_stock_count
        """;
        return jdbcTemplate.queryForMap(sql);
    }
}
