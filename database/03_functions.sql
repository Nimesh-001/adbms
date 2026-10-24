-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 03: SIX (6) STORED FUNCTIONS (MySQL Workbench 100% Compatible)
-- =====================================================================================

USE supermart_db;

-- Allow stored function creation when binary logging is enabled
SET GLOBAL log_bin_trust_function_creators = 1;

-- -------------------------------------------------------------------------------------
-- Function 1: Check if product has sufficient stock
-- -------------------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------------------
-- Function 2: Calculate delivery fee based on order subtotal
-- -------------------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------------------
-- Function 3: Calculate coupon discount amount
-- -------------------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------------------
-- Function 4: Customer lifetime spending
-- -------------------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------------------
-- Function 5: Validate Sri Lankan NIC format (9 digits + V/X or 12 digits)
-- -------------------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------------------
-- Function 6: Calculate total item count in an order
-- -------------------------------------------------------------------------------------
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
