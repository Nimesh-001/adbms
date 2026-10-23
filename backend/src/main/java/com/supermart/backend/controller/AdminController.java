package com.supermart.backend.controller;

import com.supermart.backend.dao.AnalyticsDao;
import com.supermart.backend.dao.UserDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CreateManagerRequest;
import com.supermart.backend.model.AuditLog;
import com.supermart.backend.model.DailySalesSummary;
import com.supermart.backend.model.TopSellingProduct;
import com.supermart.backend.model.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserDao userDao;
    private final AnalyticsDao analyticsDao;

    public AdminController(UserDao userDao, AnalyticsDao analyticsDao) {
        this.userDao = userDao;
        this.analyticsDao = analyticsDao;
    }

    /**
     * Create Operational Manager (Restricted to Super Admin)
     * Automatically assigns mobile phone as username
     * Invokes MySQL Stored Procedure: sp_create_operational_manager
     */
    @PostMapping("/managers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createManager(
            @RequestParam int adminId,
            @Valid @RequestBody CreateManagerRequest req) {

        Map<String, Object> result = userDao.createOperationalManager(adminId, req);
        Integer newUserId = (Integer) result.get("p_new_user_id");
        String message = (String) result.get("p_status_msg");

        if (newUserId != null && newUserId > 0) {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", newUserId);
            data.put("username", req.getMobilePhone()); // Auto-filled username
            data.put("role", "ROLE_MANAGER");
            return ResponseEntity.ok(ApiResponse.ok(message, data));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(message));
        }
    }

    @GetMapping("/managers")
    public ResponseEntity<ApiResponse<List<User>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.ok("Managers loaded", userDao.findAllManagers()));
    }

    @PatchMapping("/managers/{id}/toggle")
    public ResponseEntity<ApiResponse<String>> toggleManagerStatus(
            @PathVariable int id, 
            @RequestParam boolean active) {
        userDao.toggleUserStatus(id, active);
        return ResponseEntity.ok(ApiResponse.ok("Manager status updated"));
    }

    /**
     * Overview KPI cards for Super Admin Dashboard
     */
    @GetMapping("/analytics/kpis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpis() {
        return ResponseEntity.ok(ApiResponse.ok("KPIs loaded", analyticsDao.getOverallKpis()));
    }

    /**
     * Daily Sales Trends from View: v_daily_sales_summary
     */
    @GetMapping("/analytics/daily-sales")
    public ResponseEntity<ApiResponse<List<DailySalesSummary>>> getDailySales() {
        return ResponseEntity.ok(ApiResponse.ok("Daily sales loaded", analyticsDao.getDailySalesSummary()));
    }

    /**
     * Top Selling Products Leaderboard from View: v_top_selling_products
     */
    @GetMapping("/analytics/top-selling")
    public ResponseEntity<ApiResponse<List<TopSellingProduct>>> getTopSelling() {
        return ResponseEntity.ok(ApiResponse.ok("Top selling loaded", analyticsDao.getTopSellingProducts()));
    }

    /**
     * Day-by-day sales analytics for a specific product
     */
    @GetMapping("/analytics/product-daily-sales/{productId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductDailySales(@PathVariable int productId) {
        return ResponseEntity.ok(ApiResponse.ok("Product daily sales loaded", analyticsDao.getProductDailySales(productId)));
    }

    /**
     * Master System Audit Logs from Table: audit_logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(ApiResponse.ok("Audit logs loaded", analyticsDao.getRecentAuditLogs(limit)));
    }

    /**
     * Generate Monthly Report via Stored Procedure: sp_generate_monthly_report
     */
    @GetMapping("/monthly-report")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok("Monthly report generated", analyticsDao.getMonthlyReport(year, month)));
    }

    /**
     * Comprehensive Executive Report (Daily, Weekly, Monthly, Yearly)
     */
    @GetMapping("/analytics/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalyticsReport(
            @RequestParam(defaultValue = "monthly") String periodType,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer week,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.ok("Executive report generated", 
                analyticsDao.getComprehensiveReport(periodType, year, month, week, date)));
    }
}
