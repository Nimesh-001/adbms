-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 05: SIX (6) DATABASE TRIGGERS (MySQL Workbench 100% Compatible)
-- =====================================================================================

USE supermart_db;

-- -------------------------------------------------------------------------------------
-- Trigger 1: Deduct stock automatically when order item is added
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_after_order_item_insert_deduct_stock //
CREATE TRIGGER trg_after_order_item_insert_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET current_stock = current_stock - NEW.quantity
    WHERE product_id = NEW.product_id;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Trigger 2: Trigger stock alert when inventory reaches min stock level
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_after_product_stock_update_alert //
CREATE TRIGGER trg_after_product_stock_update_alert
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.current_stock <= NEW.min_stock_level AND OLD.current_stock > NEW.min_stock_level THEN
        INSERT INTO stock_alerts (product_id, current_stock, alert_message)
        VALUES (NEW.product_id, NEW.current_stock, 
                CONCAT('Low Stock Alert: ', NEW.product_name, ' has only ', NEW.current_stock, ' units left!'));
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Trigger 3: Audit log on product price change
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_before_product_price_audit //
CREATE TRIGGER trg_before_product_price_audit
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.unit_price != NEW.unit_price THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, details)
        VALUES ('UPDATE', 'products', NEW.product_id, 
                CONCAT('Price change for ', NEW.product_name, ': Old LKR ', OLD.unit_price, ' -> New LKR ', NEW.unit_price));
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Trigger 4: Audit log on new user creation
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_after_user_insert_audit //
CREATE TRIGGER trg_after_user_insert_audit
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, details)
    VALUES (NEW.user_id, 'INSERT', 'users', NEW.user_id, 
            CONCAT('User created: ', NEW.username, ' (Role ID: ', NEW.role_id, ')'));
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Trigger 5: Prevent negative stock integrity violation
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_before_product_stock_check //
CREATE TRIGGER trg_before_product_stock_check
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.current_stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Stock level cannot be negative!';
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Trigger 6: Audit log on order status update
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_after_order_status_update_audit //
CREATE TRIGGER trg_after_order_status_update_audit
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.order_status != NEW.order_status THEN
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, details)
        VALUES (NEW.user_id, 'UPDATE', 'orders', NEW.order_id, 
                CONCAT('Order ', NEW.order_number, ' changed status from ', OLD.order_status, ' to ', NEW.order_status));
    END IF;
END //
DELIMITER ;
