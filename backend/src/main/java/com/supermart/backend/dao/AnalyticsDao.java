package com.supermart.backend.dao;

import com.supermart.backend.model.AuditLog;
import com.supermart.backend.model.DailySalesSummary;
import com.supermart.backend.model.TopSellingProduct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.HashMap;
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
            t.setTotalProfit(rs.getBigDecimal("total_profit"));
            return t;
        });
    }

    /**
     * Day-by-day sales for a specific product
     */
    public List<Map<String, Object>> getProductDailySales(int productId) {
        String sql = """
            SELECT 
                DATE(o.order_date) AS sales_date,
                COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
                COALESCE(SUM(oi.item_total), 0) AS total_sales_revenue,
                COALESCE(SUM(oi.quantity * COALESCE(oi.base_price, 0)), 0) AS total_cost,
                COALESCE(SUM(oi.item_total - (oi.quantity * COALESCE(oi.base_price, 0))), 0) AS total_profit,
                COUNT(DISTINCT o.order_id) AS order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE oi.product_id = ? AND o.order_status != 'CANCELLED'
            GROUP BY DATE(o.order_date)
            ORDER BY sales_date ASC
        """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("salesDate", rs.getDate("sales_date").toString());
            map.put("totalQuantitySold", rs.getInt("total_quantity_sold"));
            map.put("totalSalesRevenue", rs.getBigDecimal("total_sales_revenue"));
            map.put("totalCost", rs.getBigDecimal("total_cost"));
            map.put("totalProfit", rs.getBigDecimal("total_profit"));
            map.put("orderCount", rs.getInt("order_count"));
            return map;
        }, productId);
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
                (SELECT COALESCE(SUM(o.total_amount) - SUM(items.order_cost), 0)
                 FROM orders o
                 LEFT JOIN (
                     SELECT order_id, SUM(quantity * COALESCE(base_price, 0)) AS order_cost
                     FROM order_items GROUP BY order_id
                 ) items ON o.order_id = items.order_id
                 WHERE o.order_status != 'CANCELLED') AS total_profit,
                (SELECT COUNT(*) FROM users WHERE role_id = 3) AS total_customers,
                (SELECT COUNT(*) FROM users WHERE role_id = 2) AS total_managers,
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
                (SELECT COUNT(*) FROM v_low_stock_alerts) AS low_stock_count
        """;
        return jdbcTemplate.queryForMap(sql);
    }

    /**
     * Comprehensive Executive Report for Daily, Weekly, Monthly, and Yearly periods
     */
    public Map<String, Object> getComprehensiveReport(String periodType, Integer year, Integer month, Integer week, String date) {
        int targetYear = (year != null && year > 2000) ? year : 2026;
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : 10;
        int targetWeek = (week != null && week >= 1 && week <= 53) ? week : 43;
        String targetDate = (date != null && !date.isBlank()) ? date : "2026-10-21";

        String whereClause;
        Object[] params;
        String periodLabel;

        if ("daily".equalsIgnoreCase(periodType)) {
            whereClause = "WHERE DATE(o.order_date) = ? AND o.order_status != 'CANCELLED'";
            params = new Object[]{targetDate};
            periodLabel = "Daily Audit Statement (" + targetDate + ")";
        } else if ("weekly".equalsIgnoreCase(periodType)) {
            whereClause = "WHERE YEAR(o.order_date) = ? AND WEEK(o.order_date, 1) = ? AND o.order_status != 'CANCELLED'";
            params = new Object[]{targetYear, targetWeek};
            periodLabel = "Weekly Report (Week " + targetWeek + ", " + targetYear + ")";
        } else if ("yearly".equalsIgnoreCase(periodType)) {
            whereClause = "WHERE YEAR(o.order_date) = ? AND o.order_status != 'CANCELLED'";
            params = new Object[]{targetYear};
            periodLabel = "Annual Financial Statement (Fiscal Year " + targetYear + ")";
        } else if ("all".equalsIgnoreCase(periodType)) {
            whereClause = "WHERE o.order_status != 'CANCELLED'";
            params = new Object[]{};
            periodLabel = "Complete Lifetime Revenue & Sales Audit";
        } else {
            // Default to monthly
            whereClause = "WHERE YEAR(o.order_date) = ? AND MONTH(o.order_date) = ? AND o.order_status != 'CANCELLED'";
            params = new Object[]{targetYear, targetMonth};
            String[] monthNames = {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
            periodLabel = "Monthly Revenue Statement (" + monthNames[targetMonth - 1] + " " + targetYear + ")";
        }

        // 1. Executive Summary
        String summarySql = "SELECT " +
                "COUNT(o.order_id) AS total_orders, " +
                "COALESCE(SUM(o.subtotal), 0) AS total_subtotal, " +
                "COALESCE(SUM(o.discount_amount), 0) AS total_discounts, " +
                "COALESCE(SUM(o.delivery_charge), 0) AS total_delivery_fees, " +
                "COALESCE(SUM(o.total_amount), 0) AS net_revenue, " +
                "COALESCE(SUM(items.order_cost), 0) AS total_cogs, " +
                "COALESCE(SUM(o.total_amount) - SUM(items.order_cost), 0) AS net_profit " +
                "FROM orders o " +
                "LEFT JOIN (" +
                "    SELECT order_id, SUM(quantity * COALESCE(base_price, 0)) AS order_cost " +
                "    FROM order_items GROUP BY order_id" +
                ") items ON o.order_id = items.order_id " + whereClause;

        Map<String, Object> summary = jdbcTemplate.queryForMap(summarySql, params);

        // 2. Trend Breakdown
        String trendSql = "SELECT " +
                "DATE(o.order_date) AS sales_date, " +
                "COUNT(o.order_id) AS total_orders, " +
                "COALESCE(SUM(o.subtotal), 0) AS gross_subtotal, " +
                "COALESCE(SUM(o.discount_amount), 0) AS total_discounts_given, " +
                "COALESCE(SUM(o.delivery_charge), 0) AS total_delivery_collected, " +
                "COALESCE(SUM(o.total_amount), 0) AS total_revenue, " +
                "COALESCE(SUM(items.order_cost), 0) AS total_cost, " +
                "COALESCE(SUM(o.total_amount) - SUM(items.order_cost), 0) AS total_profit " +
                "FROM orders o " +
                "LEFT JOIN (" +
                "    SELECT order_id, SUM(quantity * COALESCE(base_price, 0)) AS order_cost " +
                "    FROM order_items GROUP BY order_id" +
                ") items ON o.order_id = items.order_id " +
                whereClause + " " +
                "GROUP BY DATE(o.order_date) ORDER BY sales_date ASC";

        List<Map<String, Object>> trends = jdbcTemplate.query(trendSql, (rs, rowNum) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("salesDate", rs.getDate("sales_date").toString());
            m.put("totalOrders", rs.getInt("total_orders"));
            m.put("grossSubtotal", rs.getBigDecimal("gross_subtotal"));
            m.put("totalDiscountsGiven", rs.getBigDecimal("total_discounts_given"));
            m.put("totalDeliveryCollected", rs.getBigDecimal("total_delivery_collected"));
            m.put("totalRevenue", rs.getBigDecimal("total_revenue"));
            m.put("totalCost", rs.getBigDecimal("total_cost"));
            m.put("totalProfit", rs.getBigDecimal("total_profit"));
            return m;
        }, params);

        // 3. Top Selling Products for this period
        String topSql = "SELECT " +
                "p.product_id, p.product_name, c.category_name, b.brand_name, " +
                "COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold, " +
                "COALESCE(SUM(oi.item_total), 0) AS total_sales_revenue, " +
                "COALESCE(SUM(oi.quantity * COALESCE(oi.base_price, 0)), 0) AS total_cost, " +
                "COALESCE(SUM(oi.item_total - (oi.quantity * COALESCE(oi.base_price, 0))), 0) AS total_profit " +
                "FROM order_items oi " +
                "JOIN products p ON oi.product_id = p.product_id " +
                "JOIN categories c ON p.category_id = c.category_id " +
                "JOIN brands b ON p.brand_id = b.brand_id " +
                "JOIN orders o ON oi.order_id = o.order_id " +
                whereClause + " " +
                "GROUP BY p.product_id, p.product_name, c.category_name, b.brand_name " +
                "ORDER BY total_quantity_sold DESC LIMIT 10";

        List<Map<String, Object>> topSelling = jdbcTemplate.query(topSql, (rs, rowNum) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("productId", rs.getInt("product_id"));
            m.put("productName", rs.getString("product_name"));
            m.put("categoryName", rs.getString("category_name"));
            m.put("brandName", rs.getString("brand_name"));
            m.put("totalQuantitySold", rs.getInt("total_quantity_sold"));
            m.put("totalSalesRevenue", rs.getBigDecimal("total_sales_revenue"));
            m.put("totalCost", rs.getBigDecimal("total_cost"));
            m.put("totalProfit", rs.getBigDecimal("total_profit"));
            return m;
        }, params);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("topSelling", topSelling);
        result.put("periodType", periodType);
        result.put("periodLabel", periodLabel);
        return result;
    }
}
