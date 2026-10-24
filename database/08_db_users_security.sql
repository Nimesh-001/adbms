-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 08: DATABASE USERS & SECURITY PERMISSIONS (3 SYSTEM USER TYPES ONLY)
-- =====================================================================================

USE supermart_db;

-- 1. Super Admin DB Account: Complete DDL & Data management
CREATE USER IF NOT EXISTS 'supermart_admin'@'%' IDENTIFIED BY 'AdminDBPass#2026';
GRANT ALL PRIVILEGES ON supermart_db.* TO 'supermart_admin'@'%' WITH GRANT OPTION;

-- 2. Operational Manager DB Account: Inventory, Products, Coupons, Order Management
CREATE USER IF NOT EXISTS 'supermart_manager'@'%' IDENTIFIED BY 'ManagerDBPass#2026';
GRANT SELECT, INSERT, UPDATE ON supermart_db.products TO 'supermart_manager'@'%';
GRANT SELECT, INSERT, UPDATE ON supermart_db.coupons TO 'supermart_manager'@'%';
GRANT SELECT, UPDATE ON supermart_db.orders TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.order_items TO 'supermart_manager'@'%';
GRANT SELECT, UPDATE ON supermart_db.stock_alerts TO 'supermart_manager'@'%';
GRANT EXECUTE ON PROCEDURE supermart_db.sp_restock_product TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.v_low_stock_alerts TO 'supermart_manager'@'%';
GRANT SELECT ON supermart_db.v_active_product_catalog TO 'supermart_manager'@'%';

-- 3. Customer / Web Application DB Account: Least-privilege shopping, ordering, and profile management
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
