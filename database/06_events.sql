-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 06: SIX (6) SCHEDULED DATABASE EVENTS (MySQL Workbench 100% Compatible)
-- =====================================================================================

USE supermart_db;

-- -------------------------------------------------------------------------------------
-- Event 1: Daily cleanup of expired coupons
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_daily_cleanup_expired_coupons //
CREATE EVENT evt_daily_cleanup_expired_coupons
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE coupons
    SET is_active = FALSE
    WHERE valid_until < NOW() AND is_active = TRUE;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Event 2: Hourly stock alert resolution
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_hourly_stock_alert_check //
CREATE EVENT evt_hourly_stock_alert_check
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE stock_alerts sa
    JOIN products p ON sa.product_id = p.product_id
    SET sa.is_resolved = TRUE
    WHERE p.current_stock > p.min_stock_level AND sa.is_resolved = FALSE;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Event 3: Daily audit snapshot summary
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_daily_audit_snapshot //
CREATE EVENT evt_daily_audit_snapshot
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    INSERT INTO audit_logs (action_type, table_name, details)
    SELECT 'SNAPSHOT', 'orders', 
           CONCAT('Daily Summary: Total orders: ', COUNT(*), ', Revenue: LKR ', COALESCE(SUM(total_amount), 0))
    FROM orders
    WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Event 4: Monthly purge of old audit logs (older than 180 days)
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_monthly_purge_old_audit_logs //
CREATE EVENT evt_monthly_purge_old_audit_logs
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL 180 DAY;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Event 5: Weekly warning for zero-stock products
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_weekly_zero_stock_flag //
CREATE EVENT evt_weekly_zero_stock_flag
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    INSERT INTO audit_logs (action_type, table_name, details)
    SELECT 'WARNING', 'products', 
           CONCAT('Product ID ', product_id, ' (', product_name, ') has been at 0 stock for over 14 days.')
    FROM products
    WHERE current_stock = 0 AND updated_at < NOW() - INTERVAL 14 DAY;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Event 6: Cancel unpaid pending orders older than 48 hours
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP EVENT IF EXISTS evt_cancel_stale_pending_orders //
CREATE EVENT evt_cancel_stale_pending_orders
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE orders
    SET order_status = 'CANCELLED'
    WHERE order_status = 'PENDING' 
      AND order_date < NOW() - INTERVAL 48 HOUR;
END //
DELIMITER ;
