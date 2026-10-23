-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 02: SIX (6) ADVANCED VIEWS
-- =====================================================================================

USE supermart_db;

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

-- View 2: Low Stock Alerts for Operational Managers & Admin
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
