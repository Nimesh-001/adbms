-- =====================================================================================
-- ADVANCED DATABASE MANAGEMENT SYSTEMS (ICT3222) - MINI PROJECT
-- 07: INITIAL SEED DATA
-- =====================================================================================

USE supermart_db;

-- 1. System Roles (Strictly 3 roles)
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Super Administrator with full analytics and manager management'),
(2, 'ROLE_MANAGER', 'Operational Manager managing inventory stock, coupons, and orders'),
(3, 'ROLE_CUSTOMER', 'Registered Customer browsing, adding to cart, and placing orders')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Super Admin User
-- Can log in with username: 'admin' and password: 'admin123'
-- Admin can change their username and password at any time.
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (1, 1, 'Super', 'Admin', 'admin@supermart.com', '0770000000', 'admin', 'admin123', '199012345678', 'Male')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- 3. Initial Sample Operational Manager
-- Created by Admin: username = mobile number '0771234567', password = 'manager123'
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (2, 2, 'Sunil', 'Perera', 'sunil.ops@supermart.com', '0771234567', '0771234567', 'manager123', '198512345678', 'Male')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- 4. Initial Sample Customer
-- Self-registered customer: can log in with either email 'kamal@gmail.com' or mobile '0719876543' and password 'customer123'
INSERT INTO users (user_id, role_id, first_name, last_name, email, mobile_phone, username, password_hash, nic_number, gender)
VALUES (3, 3, 'Kamal', 'Silva', 'kamal@gmail.com', '0719876543', 'kamal@gmail.com', 'customer123', '200112345678', 'Male')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- 5. Sample Customer Delivery Address
INSERT INTO customer_addresses (address_id, user_id, recipient_name, recipient_phone, address_line1, address_line2, city, postal_code, is_default)
VALUES (1, 3, 'Kamal Silva', '0719876543', 'No 45, Temple Road', 'Nawala', 'Colombo', '10100', TRUE)
ON DUPLICATE KEY UPDATE recipient_name = VALUES(recipient_name);

-- 6. Product Categories
INSERT INTO categories (category_id, category_name, description, image_url) VALUES
(1, 'Fresh Vegetables', 'Farm-fresh garden vegetables directly from local growers', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
(2, 'Fresh Fruits', 'Delicious seasonal and exotic fruits packed with vitamins', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80'),
(3, 'Dairy & Eggs', 'Pure milk, cheese, farm eggs, and butter', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80'),
(4, 'Bakery & Bread', 'Freshly baked artisan bread, pastries, and buns', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'),
(5, 'Beverages & Tea', 'Finest Ceylon tea, natural juices, and soft drinks', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80'),
(6, 'Snacks & Confectionery', 'Crispy bites, chocolates, and delicious biscuits', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- 7. Product Brands
INSERT INTO brands (brand_id, brand_name, description) VALUES
(1, 'FarmFresh Organics', 'Organic and eco-friendly farm harvests'),
(2, 'Anchor', 'Premium dairy and milk products'),
(3, 'Dilmah', 'Finest Ceylon single-origin tea'),
(4, 'Munchee', 'Beloved crispy biscuits and confectionery'),
(5, 'Elephant House', 'Iconic beverages and ice creams'),
(6, 'Keells Krest', 'Quality pantry essentials and sausages')
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

-- 8. Products (with price for 100g or unit as specified in requirements)
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
(10, 1, 1, 'Fresh Red Bell Peppers', 'Sweet crunchy hydroponic red bell capsicums', '100g', 110.00, 0, 15, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80', FALSE) -- Out of stock demo!
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- 9. Coupons (The 2 exact required coupons)
-- Coupon 1: Buy above 3000 -> Free delivery
-- Coupon 2: Buy above 5000 -> 10% discount from total bill + Free delivery
INSERT INTO coupons (coupon_id, coupon_code, description, min_order_amount, discount_percentage, free_delivery, valid_from, valid_until, is_active) VALUES
(1, 'FREEDEL3000', 'Buy above Rs. 3,000 and get Free Delivery!', 3000.00, 0.00, TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE),
(2, 'SAVE10PLUS', 'Buy above Rs. 5,000 and get 10% Discount + Free Delivery!', 5000.00, 10.00, TRUE, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);
