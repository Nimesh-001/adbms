-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 04: SIX (6) STORED PROCEDURES (MySQL Workbench 100% Compatible)
-- =====================================================================================

USE supermart_db;

-- -------------------------------------------------------------------------------------
-- Procedure 1: Register New Customer with Validations
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_register_customer //
CREATE PROCEDURE sp_register_customer(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_mobile VARCHAR(20),
    IN p_password VARCHAR(255),
    OUT p_user_id INT,
    OUT p_status_msg VARCHAR(255)
)
BEGIN
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_phone_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_email_exists FROM users WHERE email = p_email;
    SELECT COUNT(*) INTO v_phone_exists FROM users WHERE mobile_phone = p_mobile;
    
    IF v_email_exists > 0 THEN
        SET p_user_id = -1;
        SET p_status_msg = 'Email already registered';
    ELSEIF v_phone_exists > 0 THEN
        SET p_user_id = -2;
        SET p_status_msg = 'Mobile phone already registered';
    ELSE
        INSERT INTO users (role_id, first_name, last_name, email, mobile_phone, username, password_hash)
        VALUES (3, p_first_name, p_last_name, p_email, p_mobile, p_email, p_password);
        
        SET p_user_id = LAST_INSERT_ID();
        SET p_status_msg = 'Registration Successful';
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Procedure 2: Create Operational Manager (Created by Super Admin)
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_create_operational_manager //
CREATE PROCEDURE sp_create_operational_manager(
    IN p_admin_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_mobile VARCHAR(20),
    IN p_nic VARCHAR(20),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_password VARCHAR(255),
    OUT p_new_user_id INT,
    OUT p_status_msg VARCHAR(255)
)
BEGIN
    DECLARE v_admin_role INT DEFAULT 0;
    
    SELECT role_id INTO v_admin_role FROM users WHERE user_id = p_admin_id;
    
    IF v_admin_role != 1 THEN
        SET p_new_user_id = -1;
        SET p_status_msg = 'Unauthorized: Only Super Admin can create Operational Managers';
    ELSEIF fn_validate_nic_format(p_nic) = 0 THEN
        SET p_new_user_id = -2;
        SET p_status_msg = 'Invalid NIC format';
    ELSE
        INSERT INTO users (role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
        VALUES (2, p_first_name, p_last_name, p_email, p_mobile, p_mobile, p_password, p_nic, p_gender);
        
        SET p_new_user_id = LAST_INSERT_ID();
        SET p_status_msg = 'Operational Manager Created Successfully';
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Procedure 3: Restock Product (Used by Operational Manager)
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_restock_product //
CREATE PROCEDURE sp_restock_product(
    IN p_user_id INT,
    IN p_product_id INT,
    IN p_additional_stock INT,
    OUT p_new_stock INT,
    OUT p_msg VARCHAR(255)
)
BEGIN
    IF p_additional_stock <= 0 THEN
        SET p_new_stock = -1;
        SET p_msg = 'Invalid quantity to restock';
    ELSE
        UPDATE products 
        SET current_stock = current_stock + p_additional_stock
        WHERE product_id = p_product_id;
        
        SELECT current_stock INTO p_new_stock FROM products WHERE product_id = p_product_id;
        SET p_msg = 'Product restocked successfully';
        
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, details)
        VALUES (p_user_id, 'UPDATE', 'products', p_product_id, 
                CONCAT('Restocked product ID ', p_product_id, ' by ', p_additional_stock, ' units'));
    END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Procedure 4: Add Customer Address
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_add_customer_address //
CREATE PROCEDURE sp_add_customer_address(
    IN p_user_id INT,
    IN p_recipient_name VARCHAR(150),
    IN p_recipient_phone VARCHAR(20),
    IN p_address1 VARCHAR(255),
    IN p_address2 VARCHAR(255),
    IN p_city VARCHAR(100),
    IN p_postal VARCHAR(20),
    OUT p_address_id INT
)
BEGIN
    INSERT INTO customer_addresses (user_id, recipient_name, recipient_phone, address_line1, address_line2, city, postal_code, is_default)
    VALUES (p_user_id, p_recipient_name, p_recipient_phone, p_address1, p_address2, p_city, p_postal, TRUE);
    
    SET p_address_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Procedure 5: Place Complete Order Transaction
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_place_order_transaction //
CREATE PROCEDURE sp_place_order_transaction(
    IN p_user_id INT,
    IN p_address_id INT,
    IN p_coupon_code VARCHAR(50),
    IN p_payment_method ENUM('CASH_ON_DELIVERY', 'CARD_PAYMENT'),
    IN p_subtotal DECIMAL(10,2),
    OUT p_order_id INT,
    OUT p_order_number VARCHAR(50),
    OUT p_status_msg VARCHAR(255)
)
BEGIN
    DECLARE v_coupon_id INT DEFAULT NULL;
    DECLARE v_discount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_free_delivery TINYINT(1) DEFAULT 0;
    DECLARE v_delivery_charge DECIMAL(10,2) DEFAULT 350.00;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_order_num VARCHAR(50);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = -1;
        SET p_status_msg = 'Transaction Failed: Rolled back successfully';
    END;

    START TRANSACTION;
    
    IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
        SELECT coupon_id, free_delivery INTO v_coupon_id, v_free_delivery
        FROM coupons 
        WHERE coupon_code = p_coupon_code 
          AND is_active = TRUE 
          AND NOW() BETWEEN valid_from AND valid_until
        LIMIT 1;
          
        IF v_coupon_id IS NOT NULL THEN
            SET v_discount = fn_calculate_coupon_discount(p_subtotal, p_coupon_code);
        END IF;
    END IF;
    
    SET v_delivery_charge = fn_calculate_delivery_fee(p_subtotal, v_free_delivery);
    SET v_total = (p_subtotal - v_discount) + v_delivery_charge;
    IF v_total < 0 THEN
        SET v_total = 0.00;
    END IF;
    
    SET v_order_num = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
    
    INSERT INTO orders (order_number, user_id, address_id, coupon_id, subtotal, discount_amount, delivery_charge, total_amount, order_status)
    VALUES (v_order_num, p_user_id, p_address_id, v_coupon_id, p_subtotal, v_discount, v_delivery_charge, v_total, 'CONFIRMED');
    
    SET p_order_id = LAST_INSERT_ID();
    SET p_order_number = v_order_num;
    
    INSERT INTO payments (order_id, payment_method, payment_status, amount_paid, transaction_reference)
    VALUES (
        p_order_id, 
        p_payment_method, 
        IF(p_payment_method = 'CARD_PAYMENT', 'COMPLETED', 'PENDING'),
        v_total,
        CONCAT('TXN-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'))
    );
    
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, details)
    VALUES (p_user_id, 'CHECKOUT', 'orders', p_order_id, CONCAT('Placed order ', v_order_num, ' for LKR ', v_total));
    
    COMMIT;
    SET p_status_msg = 'Order placed successfully';
END //
DELIMITER ;

-- -------------------------------------------------------------------------------------
-- Procedure 6: Generate Monthly Analytical Report
-- -------------------------------------------------------------------------------------
DELIMITER //
DROP PROCEDURE IF EXISTS sp_generate_monthly_report //
CREATE PROCEDURE sp_generate_monthly_report(
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT 
        COUNT(order_id) AS total_orders,
        COALESCE(SUM(subtotal), 0) AS total_subtotal,
        COALESCE(SUM(discount_amount), 0) AS total_discounts,
        COALESCE(SUM(delivery_charge), 0) AS total_delivery_fees,
        COALESCE(SUM(total_amount), 0) AS net_revenue
    FROM orders
    WHERE YEAR(order_date) = p_year 
      AND MONTH(order_date) = p_month
      AND order_status != 'CANCELLED';
END //
DELIMITER ;
