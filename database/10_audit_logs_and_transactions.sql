-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 10: AUDIT LOGS & ACID TRANSACTIONS MANAGEMENT
-- COMPATIBILITY: MySQL Workbench 8.0+ / MySQL 9.x
-- =====================================================================================

USE supermart_db;

-- =====================================================================================
-- SECTION 1: AUDIT LOGS LEDGER ARCHITECTURE & VERIFICATION QUERIES
-- =====================================================================================

-- 1.1 Master Audit Logs Table Definition Reference
-- (Table stores immutable audit trail populated automatically by triggers and procedures)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.2 Performance Indexes on Audit Log Table
-- Accelerates date filtering and action grouping in the Admin Audit Trail UI
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

-- -------------------------------------------------------------------------------------
-- 1.3 Audit Log Analytical Queries (Show to Lecturer during Viva)
-- -------------------------------------------------------------------------------------

-- Query A: View the 20 most recent system audit events
SELECT 
    log_id,
    created_at,
    action_type,
    table_name,
    record_id,
    details
FROM audit_logs
ORDER BY log_id DESC
LIMIT 20;

-- Query B: Summary of audit events by action type (INSERT, UPDATE, CHECKOUT, CANCEL)
SELECT 
    action_type,
    table_name,
    COUNT(*) AS total_events,
    MIN(created_at) AS first_logged,
    MAX(created_at) AS last_logged
FROM audit_logs
GROUP BY action_type, table_name
ORDER BY total_events DESC;

-- Query C: Trace full history of price changes logged by Trigger trg_before_product_price_audit
SELECT 
    log_id,
    created_at,
    record_id AS product_id,
    details
FROM audit_logs
WHERE table_name = 'products' AND action_type = 'UPDATE'
ORDER BY log_id DESC;


-- =====================================================================================
-- SECTION 2: ACID TRANSACTIONS
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- TRANSACTION 1: Order Placement & Checkout Transaction (Already defined in 04_procedures.sql)
-- Stored Procedure: sp_place_order_transaction
-- Demonstrates: Multi-table atomic insertion (orders + payments + audit_logs + order_items)
-- -------------------------------------------------------------------------------------

-- -------------------------------------------------------------------------------------
-- TRANSACTION 2: Order Cancellation & Inventory Compensation ACID Transaction
-- Stored Procedure: sp_cancel_order_transaction
-- Business Purpose: Atomically cancels an order, marks payment as REFUNDED,
-- restores reserved stock quantities back to products, and logs audit trail.
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_cancel_order_transaction //
CREATE PROCEDURE sp_cancel_order_transaction(
    IN p_order_id INT,
    IN p_user_id INT,
    IN p_cancellation_reason VARCHAR(255),
    OUT p_status_msg VARCHAR(255)
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_order_num VARCHAR(50);
    
    -- Error Handler: Automatically executes ROLLBACK if any SQL exception occurs
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_msg = 'Transaction Aborted: SQLEXCEPTION encountered. Database rolled back cleanly.';
    END;

    -- BEGIN EXPLICIT ACID TRANSACTION
    START TRANSACTION;
    
    -- 1. Row-level Lock (Pessimistic Concurrency Control)
    SELECT order_status, order_number INTO v_current_status, v_order_num 
    FROM orders 
    WHERE order_id = p_order_id 
    FOR UPDATE;
    
    -- 2. Validation Checks
    IF v_current_status IS NULL THEN
        SET p_status_msg = 'Order does not exist';
        ROLLBACK;
    ELSEIF v_current_status = 'CANCELLED' THEN
        SET p_status_msg = 'Order is already cancelled';
        ROLLBACK;
    ELSEIF v_current_status = 'DELIVERED' THEN
        SET p_status_msg = 'Cannot cancel an order that has already been delivered';
        ROLLBACK;
    ELSE
        -- 3. Inventory Compensation: Return purchased quantities back to products table
        UPDATE products p
        JOIN order_items oi ON p.product_id = oi.product_id
        SET p.current_stock = p.current_stock + oi.quantity
        WHERE oi.order_id = p_order_id;
        
        -- 4. Update Order Status
        UPDATE orders 
        SET order_status = 'CANCELLED' 
        WHERE order_id = p_order_id;
        
        -- 5. Update Payment Status to REFUNDED
        UPDATE payments 
        SET payment_status = 'REFUNDED' 
        WHERE order_id = p_order_id;
        
        -- 6. Insert Immutable Audit Log Entry
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, details)
        VALUES (
            p_user_id, 
            'CANCEL', 
            'orders', 
            p_order_id, 
            CONCAT('Order ', v_order_num, ' cancelled. Reason: ', p_cancellation_reason, '. All item quantities refunded to stock.')
        );
        
        -- COMMIT ALL CHANGES ATOMICALLY
        COMMIT;
        SET p_status_msg = 'Order cancelled, stock restored, and refund recorded successfully';
    END IF;
END //
DELIMITER ;


-- =====================================================================================
-- SECTION 3: VIVA DEMONSTRATION & VERIFICATION SCRIPTS (FOR MYSQL WORKBENCH)
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Demo Script A: Test Successful Execution of Cancellation Transaction
-- -------------------------------------------------------------------------------------
-- To test in Workbench, pass a valid order ID:
-- CALL sp_cancel_order_transaction(1, 1, 'Customer requested order cancellation', @status);
-- SELECT @status AS cancellation_result;

-- Verify the atomic changes across all 3 tables:
-- SELECT order_id, order_number, order_status FROM orders WHERE order_id = 1;
-- SELECT payment_id, order_id, payment_status FROM payments WHERE order_id = 1;
-- SELECT * FROM audit_logs WHERE record_id = 1 AND action_type = 'CANCEL';

-- -------------------------------------------------------------------------------------
-- Demo Script B: ACID Rollback Proof Demonstration
-- Shows the lecturer that if an update fails, the database maintains consistency
-- -------------------------------------------------------------------------------------
-- START TRANSACTION;
-- -- Attempt to reduce stock below zero (triggers trg_before_product_stock_check):
-- -- UPDATE products SET current_stock = -50 WHERE product_id = 1;
-- -- Result: Error Code 1644: Integrity Error: Stock level cannot be negative!
-- ROLLBACK;
-- -- Proves no negative stock was written to disk!
