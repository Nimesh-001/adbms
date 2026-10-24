-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- PROJECT: SuperMart Online Database (Pure RDBMS - No ORM)
-- COMPATIBILITY: MySQL Workbench 8.0 / MySQL 9.x (Zero Syntax Errors)
-- SYSTEM ROLES: 1. Admin | 2. Operational Manager | 3. Customer
-- =====================================================================================

DROP DATABASE IF EXISTS supermart_db;
CREATE DATABASE supermart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supermart_db;

-- Enable binary logging function creation compatibility
SET GLOBAL log_bin_trust_function_creators = 1;

-- =====================================================================================
-- SECTION 1: 3NF NORMALIZED TABLE STRUCTURES
-- =====================================================================================

-- 1.1 System Roles (Strictly 3 main roles)
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- 1.2 System Users (Admin, Operational Manager, Customer)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mobile_phone VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nic_number VARCHAR(20) NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other') NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 1.3 Customer Delivery Addresses
CREATE TABLE customer_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.4 Product Categories
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 1.5 Product Brands
CREATE TABLE brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    logo_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 1.6 Products (Foods, Groceries, Fresh Produce)
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    unit_type VARCHAR(50) DEFAULT '100g', -- '100g' or 'unit'
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(10,2) NOT NULL,    -- Price per 100g or unit in LKR
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 10,
    image_url VARCHAR(500) NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    CONSTRAINT chk_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_current_stock CHECK (current_stock >= 0)
) ENGINE=InnoDB;

-- 1.7 Coupons & Special Offers
CREATE TABLE coupons (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    min_order_amount DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    free_delivery BOOLEAN DEFAULT FALSE,
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 1.8 Orders
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    address_id INT NOT NULL,
    coupon_id INT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    delivery_charge DECIMAL(10,2) DEFAULT 350.00,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES customer_addresses(address_id),
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)
) ENGINE=InnoDB;

-- 1.9 Order Line Items
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    item_total DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- 1.10 Payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('CASH_ON_DELIVERY', 'CARD_PAYMENT') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    amount_paid DECIMAL(10,2) NOT NULL,
    transaction_reference VARCHAR(100) NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.11 System Audit Logs
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.12 Stock Alert Notifications
CREATE TABLE stock_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    current_stock INT NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================================
-- SECTION 2: INDEXING & QUERY OPTIMIZATION
-- =====================================================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_active_stock ON products(is_active, current_stock);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(order_status);

CREATE INDEX idx_users_login_email ON users(email);
CREATE INDEX idx_users_login_phone ON users(mobile_phone);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action_type);

-- =====================================================================================
-- SECTION 3: SIX (6) ADVANCED VIEWS
-- =====================================================================================

-- View 1: Active Product Catalog with Brand & Category details
CREATE OR REPLACE VIEW v_active_product_catalog AS
SELECT 
    p.product_id,
    p.product_name,
    p.description,
    p.unit_type,
    p.base_price,
    p.unit_price,
    p.current_stock,
    CASE 
        WHEN p.current_stock > 0 THEN 'In Stock'
        ELSE 'Out of Stock'
    END AS stock_status,
    p.image_url,
    p.is_featured,
    c.category_id,
    c.category_name,
    b.brand_id,
    b.brand_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN brands b ON p.brand_id = b.brand_id
WHERE p.is_active = TRUE AND c.is_active = TRUE AND b.is_active = TRUE;

-- View 2: Low Stock Alerts
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    b.brand_name,
    p.current_stock,
    p.min_stock_level,
    (p.min_stock_level - p.current_stock) AS units_needed
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN brands b ON p.brand_id = b.brand_id
WHERE p.current_stock <= p.min_stock_level;

-- View 3: Customer Order History
CREATE OR REPLACE VIEW v_customer_order_history AS
SELECT 
    o.order_id,
    o.order_number,
    o.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    u.mobile_phone,
    o.subtotal,
    o.discount_amount,
    o.delivery_charge,
    o.total_amount,
    o.order_status,
    p.payment_method,
    p.payment_status,
    o.order_date
FROM orders o
JOIN users u ON o.user_id = u.user_id
LEFT JOIN payments p ON o.order_id = p.order_id;

-- View 4: Daily Sales & Revenue Analytical Summary
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT 
    DATE(o.order_date) AS sales_date,
    COUNT(o.order_id) AS total_orders,
    SUM(o.subtotal) AS gross_subtotal,
    SUM(o.discount_amount) AS total_discounts_given,
    SUM(o.delivery_charge) AS total_delivery_collected,
    SUM(o.total_amount) AS total_revenue
FROM orders o
WHERE o.order_status != 'CANCELLED'
GROUP BY DATE(o.order_date);

-- View 5: Top Selling Products
CREATE OR REPLACE VIEW v_top_selling_products AS
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    b.brand_name,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.item_total) AS total_sales_revenue,
    SUM(oi.item_total - (oi.quantity * COALESCE(oi.base_price, 0))) AS total_profit
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
JOIN brands b ON p.brand_id = b.brand_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status != 'CANCELLED'
GROUP BY p.product_id, p.product_name, c.category_name, b.brand_name
ORDER BY total_quantity_sold DESC;

-- View 6: Currently Active Coupons
CREATE OR REPLACE VIEW v_active_coupons AS
SELECT 
    coupon_id,
    coupon_code,
    description,
    min_order_amount,
    discount_percentage,
    free_delivery,
    valid_from,
    valid_until
FROM coupons
WHERE is_active = TRUE AND NOW() BETWEEN valid_from AND valid_until;

-- =====================================================================================
-- SECTION 4: SIX (6) STORED FUNCTIONS
-- =====================================================================================

-- Function 1: Check if product has sufficient stock
DELIMITER //
DROP FUNCTION IF EXISTS fn_is_product_in_stock //
CREATE FUNCTION fn_is_product_in_stock(p_product_id INT, p_required_qty INT)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stock INT DEFAULT 0;
    SELECT current_stock INTO v_stock FROM products WHERE product_id = p_product_id;
    IF v_stock >= p_required_qty THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END //
DELIMITER ;

-- Function 2: Calculate delivery fee based on order subtotal
DELIMITER //
DROP FUNCTION IF EXISTS fn_calculate_delivery_fee //
CREATE FUNCTION fn_calculate_delivery_fee(p_subtotal DECIMAL(10,2), p_free_delivery TINYINT(1))
RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
    IF p_free_delivery = 1 OR p_subtotal >= 3000.00 THEN
        RETURN 0.00;
    ELSE
        RETURN 350.00;
    END IF;
END //
DELIMITER ;

-- Function 3: Calculate coupon discount amount
DELIMITER //
DROP FUNCTION IF EXISTS fn_calculate_coupon_discount //
CREATE FUNCTION fn_calculate_coupon_discount(p_subtotal DECIMAL(10,2), p_coupon_code VARCHAR(50))
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_min_amt DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_percent DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_discount DECIMAL(10,2) DEFAULT 0.00;
    
    SELECT min_order_amount, discount_percentage 
    INTO v_min_amt, v_percent
    FROM coupons 
    WHERE coupon_code = p_coupon_code 
      AND is_active = TRUE 
      AND NOW() BETWEEN valid_from AND valid_until
    LIMIT 1;
    
    IF v_min_amt IS NOT NULL AND p_subtotal >= v_min_amt THEN
        SET v_discount = (p_subtotal * v_percent) / 100.00;
    END IF;
    
    RETURN v_discount;
END //
DELIMITER ;

-- Function 4: Customer lifetime spending
DELIMITER //
DROP FUNCTION IF EXISTS fn_customer_lifetime_spending //
CREATE FUNCTION fn_customer_lifetime_spending(p_user_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;
    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_total
    FROM orders
    WHERE user_id = p_user_id AND order_status != 'CANCELLED';
    RETURN v_total;
END //
DELIMITER ;

-- Function 5: Validate Sri Lankan NIC format (9 digits + V/X or 12 digits)
DELIMITER //
DROP FUNCTION IF EXISTS fn_validate_nic_format //
CREATE FUNCTION fn_validate_nic_format(p_nic VARCHAR(20))
RETURNS TINYINT(1)
DETERMINISTIC
NO SQL
BEGIN
    IF p_nic REGEXP '^[0-9]{9}[vVxX]$' OR p_nic REGEXP '^[0-9]{12}$' THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END //
DELIMITER ;

-- Function 6: Calculate total item count in an order
DELIMITER //
DROP FUNCTION IF EXISTS fn_get_order_total_items //
CREATE FUNCTION fn_get_order_total_items(p_order_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_items_count INT DEFAULT 0;
    SELECT COALESCE(SUM(quantity), 0) INTO v_items_count
    FROM order_items
    WHERE order_id = p_order_id;
    RETURN v_items_count;
END //
DELIMITER ;

-- =====================================================================================
-- SECTION 5: SIX (6) STORED PROCEDURES
-- =====================================================================================

-- Procedure 1: Register New Customer with Validations
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

-- Procedure 2: Create Operational Manager (Created by Super Admin)
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

-- Procedure 3: Restock Product (Used by Operational Manager)
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

-- Procedure 4: Add Customer Address
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

-- Procedure 5: Place Complete Order Transaction
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

-- Procedure 6: Generate Monthly Analytical Report
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

-- =====================================================================================
-- SECTION 6: SIX (6) TRIGGERS
-- =====================================================================================

-- Trigger 1: Deduct stock automatically when order item is added
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

-- Trigger 2: Trigger stock alert when inventory reaches min stock level
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

-- Trigger 3: Audit log on product price change
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

-- Trigger 4: Audit log on new user creation
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

-- Trigger 5: Prevent negative stock integrity violation
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

-- Trigger 6: Audit log on order status update
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

-- =====================================================================================
-- SECTION 7: SIX (6) SCHEDULED DATABASE EVENTS
-- =====================================================================================

-- Event 1: Daily cleanup of expired coupons
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

-- Event 2: Hourly stock alert resolution
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

-- Event 3: Daily audit snapshot summary
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

-- Event 4: Monthly purge of old audit logs (older than 180 days)
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

-- Event 5: Weekly warning for zero-stock products
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

-- Event 6: Cancel unpaid pending orders older than 48 hours
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

-- =====================================================================================
-- SECTION 8: SEED DATA
-- =====================================================================================

-- 3 System Roles Only
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Super Administrator with complete system analytics and manager management'),
(2, 'ROLE_MANAGER', 'Operational Manager managing inventory stock, coupons, and orders'),
(3, 'ROLE_CUSTOMER', 'Registered Customer browsing, adding to cart, and placing orders');

-- Super Admin User (admin / admin123)
-- Admin can change their username and password at any time.
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (1, 1, 'Super', 'Admin', 'admin@supermart.com', '0770000000', 'admin', 'admin123', '199012345678', 'Male');

-- Initial Sample Operational Manager (Added by Admin: username = mobile number '0771234567', password = manager123)
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (2, 2, 'Sunil', 'Perera', 'sunil.ops@supermart.com', '0771234567', '0771234567', 'manager123', '198512345678', 'Male');

-- Initial Sample Customer (Self-registered: kamal@gmail.com / customer123)
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (3, 3, 'Kamal', 'Silva', 'kamal@gmail.com', '0719876543', 'kamal@gmail.com', 'customer123', '200112345678', 'Male');

-- Sample Customer Address
INSERT INTO customer_addresses (address_id, user_id, recipient_name, recipient_phone, address_line1, address_line2, city, postal_code, is_default)
VALUES (1, 3, 'Kamal Silva', '0719876543', 'No 45, Temple Road', 'Nawala', 'Colombo', '10100', TRUE);

-- Categories
INSERT INTO categories (category_id, category_name, description, image_url) VALUES
(1, 'Fresh Vegetables', 'Farm-fresh garden vegetables directly from local growers', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
(2, 'Fresh Fruits', 'Delicious seasonal and exotic fruits packed with vitamins', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80'),
(3, 'Dairy & Eggs', 'Pure milk, cheese, farm eggs, and butter', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80'),
(4, 'Bakery & Bread', 'Freshly baked artisan bread, pastries, and buns', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'),
(5, 'Beverages & Tea', 'Finest Ceylon tea, natural juices, and soft drinks', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80'),
(6, 'Snacks & Confectionery', 'Crispy bites, chocolates, and delicious biscuits', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80');

-- Brands
INSERT INTO brands (brand_id, brand_name, description) VALUES
(1, 'FarmFresh Organics', 'Organic and eco-friendly farm harvests'),
(2, 'Anchor', 'Premium dairy and milk products'),
(3, 'Dilmah', 'Finest Ceylon single-origin tea'),
(4, 'Munchee', 'Beloved crispy biscuits and confectionery'),
(5, 'Elephant House', 'Iconic beverages and ice creams'),
(6, 'Keells Krest', 'Quality pantry essentials and sausages');

-- Products (with price for 100g or unit as specified in requirements)
INSERT INTO products (product_id, category_id, brand_id, product_name, description, unit_type, unit_price, current_stock, min_stock_level, image_url, is_featured) VALUES
(1, 1, 1, 'Organic Red Carrots', 'Crisp mountain grown organic carrots, rich in Beta Carotene', '100g', 45.00, 250, 20, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80', TRUE),
(2, 1, 1, 'Fresh Green Broccoli', 'Fresh hand-picked florets, high in antioxidants', '100g', 120.00, 150, 15, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80', TRUE),
(3, 2, 1, 'Cavendish Ripe Bananas', 'Naturally ripened sweet dessert bananas', '100g', 35.00, 300, 30, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', TRUE),
(4, 2, 1, 'Crispy Fuji Apples', 'Sweet and crunchy premium imported apples', '100g', 95.00, 180, 25, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', FALSE),
(5, 3, 2, 'Anchor Pure Fresh Milk', '100% pure pasteurized wholesome cows milk 1 Liter', 'unit', 480.00, 80, 15, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80', TRUE),
(6, 3, 2, 'Anchor Salted Pure Butter', 'Rich creamy New Zealand grass-fed dairy butter 227g', 'unit', 850.00, 50, 10, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80', FALSE),
(7, 4, 1, 'Whole Grain Brown Bread', 'Freshly baked wholesome sliced fiber-rich whole wheat bread', 'unit', 220.00, 40, 10, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', TRUE),
(8, 5, 3, 'Dilmah Premium Ceylon Tea', 'Single origin pure Ceylon black tea tea bags pack of 50', 'unit', 620.00, 90, 20, 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80', TRUE),
(9, 6, 4, 'Munchee Super Cream Cracker', 'Crispy nutritious golden baked Sri Lankan cream crackers 500g', 'unit', 340.00, 120, 25, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80', FALSE),
(10, 1, 1, 'Fresh Red Bell Peppers', 'Sweet crunchy hydroponic red bell capsicums', '100g', 110.00, 0, 15, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80', FALSE);

-- Coupons (The 2 exact coupons specified by you):
-- 1: Buy above Rs. 3,000 -> Free delivery
-- 2: Buy above Rs. 5,000 -> 10% discount from total bill + Free delivery
INSERT INTO coupons (coupon_id, coupon_code, description, min_order_amount, discount_percentage, free_delivery, valid_from, valid_until, is_active) VALUES
(1, 'FREEDEL3000', 'Buy above Rs. 3,000 and get Free Delivery!', 3000.00, 0.00, TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE),
(2, 'SAVE10PLUS', 'Buy above Rs. 5,000 and get 10% Discount + Free Delivery!', 5000.00, 10.00, TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE);

-- =====================================================================================
-- SECTION 9: DATABASE ACCOUNTS & PRIVILEGES (3 SYSTEM USER TYPES ONLY)
-- =====================================================================================

-- 9.1 Super Admin DB Account: Schema, DDL, Security and Full Management
CREATE USER IF NOT EXISTS 'supermart_admin'@'%' IDENTIFIED BY 'AdminDBPass#2026';
GRANT ALL PRIVILEGES ON supermart_db.* TO 'supermart_admin'@'%' WITH GRANT OPTION;

-- 9.2 Operational Manager DB Account: Inventory, Products, Coupons, and Order Tracking
CREATE USER IF NOT EXISTS 'supermart_manager'@'%' IDENTIFIED BY 'ManagerDBPass#2026';
GRANT SELECT, INSERT, UPDATE ON supermart_db.products TO 'supermart_manager'@'%';
GRANT SELECT, INSERT, UPDATE ON supermart_db.coupons TO 'supermart_manager'@'%';
GRANT SELECT, UPDATE ON supermart_db.orders TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.order_items TO 'supermart_manager'@'%';
GRANT SELECT, UPDATE ON supermart_db.stock_alerts TO 'supermart_manager'@'%';
GRANT EXECUTE ON PROCEDURE supermart_db.sp_restock_product TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.v_low_stock_alerts TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.v_active_product_catalog TO 'supermart_manager'@'%';

-- 9.3 Customer / Web Application DB Account: Least Privilege Shopping & Transactions
CREATE USER IF NOT EXISTS 'supermart_customer'@'%' IDENTIFIED BY 'CustomerAppPass#2026';
GRANT SELECT ON supermart_db.roles TO 'supermart_customer'@'%';
GRANT SELECT, INSERT, UPDATE ON supermart_db.users TO 'supermart_customer'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON supermart_db.customer_addresses TO 'supermart_customer'@'%';
GRANT SELECT ON supermart_db.categories TO 'supermart_customer'@'%';
GRANT SELECT ON supermart_db.brands TO 'supermart_customer'@'%';
GRANT SELECT, UPDATE ON supermart_db.products TO 'supermart_customer'@'%';
GRANT SELECT ON supermart_db.coupons TO 'supermart_customer'@'%';
GRANT SELECT, INSERT, UPDATE ON supermart_db.orders TO 'supermart_customer'@'%';
GRANT SELECT, INSERT ON supermart_db.order_items TO 'supermart_customer'@'%';
GRANT SELECT, INSERT, UPDATE ON supermart_db.payments TO 'supermart_customer'@'%';
GRANT INSERT ON supermart_db.audit_logs TO 'supermart_customer'@'%';
GRANT EXECUTE ON PROCEDURE supermart_db.sp_register_customer TO 'supermart_customer'@'%';
GRANT EXECUTE ON PROCEDURE supermart_db.sp_add_customer_address TO 'supermart_customer'@'%';
GRANT EXECUTE ON PROCEDURE supermart_db.sp_place_order_transaction TO 'supermart_customer'@'%';

FLUSH PRIVILEGES;

-- =====================================================================================
-- END OF DATABASE SCRIPT
-- =====================================================================================
