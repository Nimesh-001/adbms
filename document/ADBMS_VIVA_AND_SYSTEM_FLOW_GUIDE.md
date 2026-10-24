# SuperMart Online Grocery - ADBMS System Flow & Viva Presentation Guide
**Course:** Advanced Database Management Systems (ICT3222)  
**Topic:** Complete Architectural Trace & Viva Guide: Views, Stored Functions, Stored Procedures, Triggers, Events, Database Privileges, Audit Logs & ACID Transactions

---

## 1. Six (6) Advanced Database Views

| View Name | Business Purpose (Why we use this?) | Core Logic & What happens in DB | Frontend Screen (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`v_active_product_catalog`** | Display active supermarket catalog with joined category & brand names and calculated stock badge without complex repetitive SQL joins in Java. | Pre-joins `products`, `categories`, and `brands`. Computes `CASE WHEN current_stock > 0 THEN 'In Stock' ELSE 'Out of Stock' END AS stock_status`. Filters `is_active = TRUE`. | **Home Page (Customer)**: Product grid, search bar, category chips, stock badges. | **Frontend:** `frontend/src/components/CustomerHome.jsx`<br>**Controller:** `backend/.../ProductController.java` (`GET /api/products`)<br>**DAO:** `backend/.../ProductDao.java` (`getAllActiveProducts`, `searchProducts`)<br>**DB:** `database/02_views.sql` | **Q: Why use a View instead of querying `products` directly?**<br>**A:** A view abstracts 3 joined tables (`products`, `categories`, `brands`) and encapsulates business rules (`is_active=TRUE`, stock status), keeping backend queries clean and optimized. |
| **`v_low_stock_alerts`** | Real-time inventory replenishment alerts for Operational Managers & Super Admin when stock hits minimum safety threshold. | Filters `products` joined with categories and brands where `current_stock <= min_stock_level`. Computes `(min_stock_level - current_stock) AS units_needed`. | **Manager Dashboard**: Tab 2 ("Low Stock Alerts") with red badge and direct restock buttons. | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Controller:** `backend/.../ProductController.java` (`GET /api/products/alerts`)<br>**DAO:** `backend/.../ProductDao.java` (`getLowStockAlerts`)<br>**DB:** `database/02_views.sql` | **Q: How does the manager know how much to restock?**<br>**A:** The view dynamically calculates `units_needed` on the fly so the manager knows the exact deficit without manual calculation. |
| **`v_customer_order_history`** | Consolidated historical order view combining customer profile, delivery fees, coupons, and payment statuses for receipts & tracking. | Joins `orders`, `users`, and `payments`. Concatenates customer full name, extracts payment method, status, delivery fee, and net total. | **Customer Profile / Orders Tab**: "My Orders" list and printable receipt modal. | **Frontend:** `frontend/src/components/ReceiptModal.jsx` & `CustomerHome.jsx`<br>**Controller:** `backend/.../OrderController.java` (`GET /api/orders/my`)<br>**DAO:** `backend/.../OrderDao.java` (`getOrdersByUserId`, `getAllOrders`)<br>**DB:** `database/02_views.sql` | **Q: Why join `payments` with `LEFT JOIN`?**<br>**A:** To ensure that even if a payment record is pending or in-flight, order records will still display properly without being omitted. |
| **`v_daily_sales_summary`** | Fast analytical aggregation of daily revenue, gross sales, delivery charges, and discounts for administrative decision making. | Groups non-cancelled `orders` by `DATE(order_date)`. Computes `COUNT(order_id)`, `SUM(subtotal)`, `SUM(discount_amount)`, `SUM(delivery_charge)`, and `SUM(total_amount)`. | **Admin Dashboard**: Tab 1 ("Analytics & Revenue Summary") and Daily Sales Trend chart. | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Controller:** `backend/.../AdminController.java` (`GET /api/admin/daily-sales`)<br>**DAO:** `backend/.../AnalyticsDao.java` (`getDailySalesTrends`)<br>**DB:** `database/02_views.sql` | **Q: What is the performance benefit of this View?**<br>**A:** It abstracts grouping logic and eliminates running manual multi-column aggregations repeatedly across large orders tables. |
| **`v_top_selling_products`** | Executive leaderboard displaying highest grossing supermarket products and profit margins. | Joins `order_items`, `products`, `categories`, `brands`, and `orders`. Aggregates `SUM(quantity)` and `SUM(item_total)`. Computes `total_profit = SUM(item_total - (quantity * base_price))`. Orders by units sold DESC. | **Admin Dashboard**: Section 2 ("Top Selling Supermarket Products") leaderboard table. | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Controller:** `backend/.../AdminController.java` (`GET /api/admin/top-products`)<br>**DAO:** `backend/.../AnalyticsDao.java` (`getTopSellingProducts`)<br>**DB:** `database/02_views.sql` | **Q: How does the system calculate profit?**<br>**A:** The view calculates `item_total - (quantity * COALESCE(base_price, 0))`. Wholesale base price is subtracted from retail selling price for each line item. |
| **`v_active_coupons`** | Ensures customers and checkout modals only see active, valid promotional codes that are within their date window. | Queries `coupons` where `is_active = TRUE AND NOW() BETWEEN valid_from AND valid_until`. | **Checkout Modal**: "Available Coupons" dropdown list and discount preview. | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**Controller:** `backend/.../CouponController.java` (`GET /api/coupons/active`)<br>**DAO:** `backend/.../CouponDao.java` (`getActiveCoupons`)<br>**DB:** `database/02_views.sql` | **Q: What prevents customers from using an expired coupon?**<br>**A:** This view filters out expired coupons automatically using `NOW() BETWEEN valid_from AND valid_until`. |

---

## 2. Six (6) Stored Functions

| Function Name & Return Type | Business Purpose (Why we use this?) | Core Logic & What happens in DB | Frontend Screen (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`fn_is_product_in_stock(product_id, qty)`**<br>`-> TINYINT(1)` | Fast boolean inventory validation to prevent overselling or adding depleted stock to cart. | Queries `products.current_stock`. Returns `1` if `current_stock >= p_required_qty`, else returns `0`. | **Home Page & Cart Drawer**: Product card "Add to Cart" button disabled if stock is 0. | **Frontend:** `frontend/src/components/CustomerHome.jsx`<br>**Backend:** Invoked during stock validation routines<br>**DB:** `database/03_functions.sql` | **Q: What is the difference between a Function and a Procedure here?**<br>**A:** Stored Functions return a single scalar value (`1` or `0`) and can be used directly inline within SQL expressions and `IF` conditions. |
| **`fn_calculate_delivery_fee(subtotal, free_flag)`**<br>`-> DECIMAL(10,2)` | Enforces the supermarket shipping rule: Free delivery for orders >= Rs. 3,000 or eligible coupon; flat Rs. 350 otherwise. | `IF p_free_delivery = 1 OR p_subtotal >= 3000.00 THEN RETURN 0.00; ELSE RETURN 350.00; END IF;` | **Checkout Modal**: Delivery charge line item updates live from Rs. 350.00 to Rs. 0.00. | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**Procedure:** Called inside `sp_place_order_transaction`<br>**Controller:** `backend/.../OrderController.java`<br>**DB:** `database/03_functions.sql` & `04_procedures.sql` | **Q: Where is this function called?**<br>**A:** It is called directly inside the stored procedure `sp_place_order_transaction` during checkout to compute final order totals securely on the database level. |
| **`fn_calculate_coupon_discount(subtotal, code)`**<br>`-> DECIMAL(10,2)` | Calculates discount amount based on active coupon percentage and minimum spending threshold. | Validates coupon in `coupons`. If `subtotal >= min_order_amount`, computes `(subtotal * discount_percentage) / 100.00`, else returns `0.00`. | **Checkout Modal**: Applied coupon badge showing exact rupee savings (e.g. 10% off for orders > Rs. 5000). | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**Procedure:** Called inside `sp_place_order_transaction`<br>**Controller:** `backend/.../OrderController.java`<br>**DB:** `database/03_functions.sql` & `04_procedures.sql` | **Q: What happens if an order doesn't meet the coupon minimum amount?**<br>**A:** The function checks `p_subtotal >= v_min_amt`. If threshold is not met, discount defaults to `0.00`. |
| **`fn_customer_lifetime_spending(user_id)`**<br>`-> DECIMAL(10,2)` | Computes total lifetime revenue generated by an individual customer (Customer Lifetime Value - CLV). | `SELECT COALESCE(SUM(total_amount), 0.00) FROM orders WHERE user_id = p_user_id AND order_status != 'CANCELLED';` | **Customer Profile Modal**: Green "Customer Lifetime Value" card with gold badge. | **Frontend:** `frontend/src/components/ProfileModal.jsx`<br>**Controller:** `backend/.../AuthController.java` (`GET /api/auth/profile/{id}`)<br>**DAO:** `backend/.../AnalyticsDao.java` (`getCustomerLifetimeSpending`)<br>**DB:** `database/03_functions.sql` | **Q: Why exclude 'CANCELLED' orders?**<br>**A:** Cancelled orders represent uncollected revenue and would distort the customer's genuine financial value to the store. |
| **`fn_validate_nic_format(nic)`**<br>`-> TINYINT(1)` | Regex validation ensuring National Identity Cards strictly conform to Sri Lankan government standards. | Evaluates regex: `p_nic REGEXP '^[0-9]{9}[vVxX]$' OR p_nic REGEXP '^[0-9]{12}$'`. Returns `1` if matched, `0` if invalid. | **Admin Dashboard**: "Add Operational Manager" modal validation error prompt if NIC is invalid. | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Procedure:** Called inside `sp_create_operational_manager`<br>**Controller:** `backend/.../AdminController.java`<br>**DB:** `database/03_functions.sql` & `04_procedures.sql` | **Q: Why validate NIC in the database when frontend can also validate it?**<br>**A:** Database-level integrity is paramount. If someone bypasses the UI or connects directly via API/CLI, the database guarantees no corrupt NIC is saved. |
| **`fn_get_order_total_items(order_id)`**<br>`-> INT` | Calculates the total count of physical grocery items in an order without returning full item lists. | `SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = p_order_id;` | **Receipt Modal / Order Summaries**: Displays total items count badge on receipts. | **Frontend:** `frontend/src/components/ReceiptModal.jsx`<br>**Backend:** Invoked during order summary calculation<br>**DB:** `database/03_functions.sql` | **Q: Why use `COALESCE` in this function?**<br>**A:** If an order has no line items, `SUM()` returns `NULL`. `COALESCE(SUM(), 0)` guarantees a safe integer `0`. |

---

## 3. Six (6) Stored Procedures

| Procedure Name & Parameters | Business Purpose (Why we use this?) | Core Logic & What happens in DB | Frontend Screen (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`sp_register_customer`**<br>`(first_name, last_name, email, mobile, password, OUT user_id, OUT msg)` | Registers a new customer with validation checking duplicate emails and phone numbers. | Checks `COUNT(*)` in `users` for email and mobile phone. If duplicates exist, returns error codes (`-1`, `-2`). Otherwise inserts user with `role_id = 3` and sets `username = email`. | **Navbar / Auth Modal**: "Create Account" tab with validation alerts. | **Frontend:** `frontend/src/components/AuthModal.jsx`<br>**Controller:** `backend/.../AuthController.java` (`POST /api/auth/register`)<br>**DAO:** `backend/.../UserDao.java` (`registerCustomer`)<br>**DB:** `database/04_procedures.sql` | **Q: What trigger executes when this procedure runs?**<br>**A:** Trigger `trg_after_user_insert_audit` fires automatically after `INSERT ON users` to record the creation in `audit_logs`. |
| **`sp_create_operational_manager`**<br>`(admin_id, first_name, last_name, email, mobile, nic, gender, password, OUT new_id, OUT msg)` | Restricts creation of operational staff to Super Admins only; validates NIC and auto-assigns username to mobile number. | Verifies `admin_id` has `role_id = 1`. Validates NIC via `fn_validate_nic_format(p_nic)`. Inserts user with `role_id = 2` and sets `username = mobile`. | **Admin Dashboard**: Tab 3 ("Operational Managers") -> "Add New Manager" modal. | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Controller:** `backend/.../AdminController.java` (`POST /api/admin/managers`)<br>**DAO:** `backend/.../UserDao.java` (`createOperationalManager`)<br>**DB:** `database/04_procedures.sql` | **Q: What security check is performed inside this procedure?**<br>**A:** It checks `role_id` of caller: `IF v_admin_role != 1 THEN ... Unauthorized`. Only Role 1 (Super Admin) is authorized. |
| **`sp_restock_product`**<br>`(user_id, product_id, additional_stock, OUT new_stock, OUT msg)` | Secure inventory replenishment by Managers; audits who performed restock and quantity added. | Validates `additional_stock > 0`. Updates `products.current_stock = current_stock + additional_stock`. Inserts entry in `audit_logs`. Returns updated stock. | **Manager Dashboard**: "Restock Product" modal button on catalog or low stock alerts table. | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Controller:** `backend/.../ProductController.java` (`POST /api/products/restock`)<br>**DAO:** `backend/.../ProductDao.java` (`restockProduct`)<br>**DB:** `database/04_procedures.sql` | **Q: How does restocking affect stock alerts?**<br>**A:** Scheduled Event `evt_hourly_stock_alert_check` inspects restocked products and sets `is_resolved = TRUE` on alert records. |
| **`sp_add_customer_address`**<br>`(user_id, recipient, phone, addr1, addr2, city, postal, OUT address_id)` | Creates delivery destination linked to user; marks as default shipping address. | Inserts record into `customer_addresses` with `is_default = TRUE`. Captures and returns `LAST_INSERT_ID()`. | **Checkout Modal / Profile**: "Add New Delivery Address" form during checkout step 1. | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**Controller:** `backend/.../AddressController.java` (`POST /api/addresses`)<br>**DAO:** `backend/.../AddressDao.java` (`addAddress`)<br>**DB:** `database/04_procedures.sql` | **Q: Why use a stored procedure for address insertion?**<br>**A:** It encapsulates ID generation and default address flag handling, returning the new address ID in a single round-trip. |
| **`sp_place_order_transaction`**<br>`(user_id, address_id, coupon_code, payment_method, subtotal, OUT order_id, OUT order_number, OUT msg)` | ACID-compliant order transaction: applies coupons, calculates shipping, creates order, generates payment record, and logs audit trail. | Enclosed in `START TRANSACTION ... COMMIT` with `DECLARE EXIT HANDLER FOR SQLEXCEPTION` (auto-rollback). Calls `fn_calculate_coupon_discount` and `fn_calculate_delivery_fee`. Generates order number `ORD-YYYYMMDDHHMMSS`. Inserts `orders`, `payments`, and `audit_logs`. | **Checkout Modal**: Final "Place Order" button. Displays order confirmation modal with receipt. | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**Controller:** `backend/.../OrderController.java` (`POST /api/orders`)<br>**DAO:** `backend/.../OrderDao.java` (`placeOrderTransaction`)<br>**DB:** `database/04_procedures.sql` | **Q: How does this procedure guarantee ACID properties?**<br>**A:** `START TRANSACTION` ensures all insertions (`orders`, `payments`, `audit_logs`) succeed together. If any error occurs, the `SQLEXCEPTION` exit handler automatically executes `ROLLBACK`. |
| **`sp_generate_monthly_report`**<br>`(year, month)` | Generates complete month-end financial report for management. | Aggregates uncancelled orders for specified year and month: `COUNT(order_id)`, `SUM(subtotal)`, `SUM(discount_amount)`, `SUM(delivery_charge)`, and `SUM(total_amount) AS net_revenue`. | **Admin Dashboard**: Tab 1 ("Monthly Revenue Report") with month/year picker and printable summary. | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Controller:** `backend/.../AdminController.java` (`GET /api/admin/monthly-report`)<br>**DAO:** `backend/.../AnalyticsDao.java` (`generateMonthlyReport`)<br>**DB:** `database/04_procedures.sql` | **Q: What is the benefit of a parameterized reporting procedure?**<br>**A:** Administrators can instantly query any historical month on demand without hardcoding date ranges. |

---

## 4. Six (6) Database Triggers

| Trigger Name & Event | Business Purpose (Why we use this?) | Core Logic & What happens in DB | Frontend Screen (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`trg_after_order_item_insert_deduct_stock`**<br>`AFTER INSERT ON order_items` | Automatically synchronizes real-time inventory levels whenever a customer purchases items. | For each inserted order line item: `UPDATE products SET current_stock = current_stock - NEW.quantity WHERE product_id = NEW.product_id;` | **Home Page & Manager Dashboard**: Immediately see current stock count decrease after customer places an order. | **Frontend:** `frontend/src/components/CheckoutModal.jsx`<br>**DAO:** `backend/.../OrderDao.java` (`placeOrderTransaction` line item insert)<br>**DB:** `database/05_triggers.sql` | **Q: Why use a trigger for stock deduction instead of updating in Java?**<br>**A:** Triggers ensure inventory cannot be bypassed by any direct SQL insert or external client, guaranteeing stock data consistency. |
| **`trg_after_product_stock_update_alert`**<br>`AFTER UPDATE ON products` | Automatic threshold warning: Generates stock alert notification when inventory drops to or below minimum safety stock level. | `IF NEW.current_stock <= NEW.min_stock_level AND OLD.current_stock > NEW.min_stock_level THEN INSERT INTO stock_alerts ...` | **Manager Dashboard**: Real-time red warning badge and new row in Low Stock Alerts table. | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Trigger Origin:** Fired by stock deduction trigger or manual updates<br>**DB:** `database/05_triggers.sql` | **Q: Why does the trigger check `OLD.current_stock > NEW.min_stock_level`?**<br>**A:** To prevent duplicate alert spam on consecutive updates while the product is already below threshold. |
| **`trg_before_product_price_audit`**<br>`BEFORE UPDATE ON products` | Audits price updates to prevent fraudulent or accidental retail price tampering by staff. | `IF OLD.unit_price != NEW.unit_price THEN INSERT INTO audit_logs (action_type, table_name, record_id, details) VALUES ('UPDATE', 'products', NEW.product_id, CONCAT('Price change: Old ', OLD.unit_price, ' -> New ', NEW.unit_price));` | **Manager Dashboard**: Edit product price modal -> updates immediately logged in DB `audit_logs` table. | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Controller:** `backend/.../ProductController.java` (`PUT /api/products/{id}`)<br>**DAO:** `backend/.../ProductDao.java` (`updateProduct`)<br>**DB:** `database/05_triggers.sql` | **Q: Why is this a `BEFORE UPDATE` trigger?**<br>**A:** A `BEFORE` trigger captures the exact pre-update values (`OLD.unit_price`) safely before row changes are finalized on disk. |
| **`trg_after_user_insert_audit`**<br>`AFTER INSERT ON users` | Security auditing: Logs all user registrations and manager onboardings for regulatory compliance. | Inserts record into `audit_logs` containing `NEW.user_id`, `NEW.username`, `NEW.role_id`, and timestamp. | **Admin & Auth**: Triggers whenever a customer registers or admin creates a manager. | **Frontend:** `frontend/src/components/AuthModal.jsx` / `AdminDashboard.jsx`<br>**DAO:** `backend/.../UserDao.java`<br>**DB:** `database/05_triggers.sql` | **Q: What table stores these logs?**<br>**A:** The central `audit_logs` table, storing user ID, action type, table name, record ID, and description. |
| **`trg_before_product_stock_check`**<br>`BEFORE UPDATE ON products` | Enforces database integrity: Prevents negative stock levels under any circumstance. | `IF NEW.current_stock < 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Error: Stock level cannot be negative!'; END IF;` | **Manager Restock / Customer Cart**: Any operation attempting to reduce stock below 0 is aborted with SQL error. | **Database Level Integrity Enforcement**<br>**DB:** `database/05_triggers.sql` | **Q: What does `SIGNAL SQLSTATE '45000'` do?**<br>**A:** It throws a custom user-defined database exception, instantly canceling the executing SQL statement and preventing corrupt data. |
| **`trg_after_order_status_update_audit`**<br>`AFTER UPDATE ON orders` | Tracks order lifecycle progression for accountability (Pending -> Confirmed -> Shipped -> Delivered). | `IF OLD.order_status != NEW.order_status THEN INSERT INTO audit_logs ... VALUES (..., CONCAT('Order ', NEW.order_number, ' changed status from ', OLD.order_status, ' to ', NEW.order_status));` | **Manager Dashboard**: Tab 4 ("Orders") -> Change status dropdown (e.g. from PENDING to CONFIRMED). | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Controller:** `backend/.../OrderController.java` (`PUT /api/orders/{id}/status`)<br>**DAO:** `backend/.../OrderDao.java` (`updateOrderStatus`)<br>**DB:** `database/05_triggers.sql` | **Q: Why audit order status transitions?**<br>**A:** To maintain an undeniable audit trail of who changed an order status and when it was dispatched or delivered. |

---

## 5. Six (6) Scheduled Database Events

| Event Name & Schedule | Business Purpose (Why we use this?) | Core Logic & What happens in DB | Frontend Screen / System Impact | Database SQL File | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`evt_daily_cleanup_expired_coupons`**<br>`EVERY 1 DAY` | Maintenance: Automatically deactivates expired promotional coupons so they cannot be redeemed. | `UPDATE coupons SET is_active = FALSE WHERE valid_until < NOW() AND is_active = TRUE;` | **Checkout Modal**: Expired coupons vanish automatically from available discounts. | `database/06_events.sql` | **Q: What is a MySQL Event?**<br>**A:** A task that runs according to a schedule inside the MySQL server daemon, similar to a cron job in Linux. |
| **`evt_hourly_stock_alert_check`**<br>`EVERY 1 HOUR` | Automated resolution: Resolves low stock warnings once stock has been replenished above threshold. | `UPDATE stock_alerts sa JOIN products p ON sa.product_id = p.product_id SET sa.is_resolved = TRUE WHERE p.current_stock > p.min_stock_level AND sa.is_resolved = FALSE;` | **Manager Dashboard**: Low stock alerts table clears resolved items once restocked. | `database/06_events.sql` | **Q: Why run this on an hourly schedule?**<br>**A:** It runs automatically in the background without needing human staff to manually click "Mark as Resolved" after restocking. |
| **`evt_daily_audit_snapshot`**<br>`EVERY 1 DAY` | Takes daily financial snapshot summary for historical bookkeeping and auditing. | Calculates previous day's order volume and revenue: `SELECT 'SNAPSHOT', 'orders', CONCAT('Daily Summary: Total orders: ', COUNT(*), ', Revenue: LKR ', SUM(total_amount)) FROM orders WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY;` Inserts into `audit_logs`. | **Database Audit Trail**: Daily summary rows populated in `audit_logs`. | `database/06_events.sql` | **Q: What happens if there are no orders on a day?**<br>**A:** `COALESCE(SUM(total_amount), 0)` prevents `NULL` and correctly records `0`. |
| **`evt_monthly_purge_old_audit_logs`**<br>`EVERY 1 MONTH` | Database optimization: Prevents audit table bloat and conserves disk storage. | `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL 180 DAY;` | **System Storage**: Keeps DB size small and fast while maintaining 6 months of historical compliance records. | `database/06_events.sql` | **Q: Why keep 180 days of logs instead of deleting immediately?**<br>**A:** 180 days (6 months) complies with financial audit standards while automatically purging old obsolete logs to maintain query performance. |
| **`evt_weekly_zero_stock_flag`**<br>`EVERY 1 WEEK` | Identifies dead inventory: Flags products that have remained at zero stock for over two weeks. | `INSERT INTO audit_logs (action_type, table_name, details) SELECT 'WARNING', 'products', CONCAT('Product ', product_name, ' has been at 0 stock for over 14 days.') FROM products WHERE current_stock = 0 AND updated_at < NOW() - INTERVAL 14 DAY;` | **Audit Logs / Operations**: Flags abandoned products so managers can either reorder from suppliers or unlist them. | `database/06_events.sql` | **Q: How does this help store operations?**<br>**A:** It surfaces chronic stockouts where suppliers may have discontinued an item, preventing stale zero-stock items on the catalog. |
| **`evt_cancel_stale_pending_orders`**<br>`EVERY 1 DAY` | Releases reserved inventory: Cancels abandoned pending orders older than 48 hours. | `UPDATE orders SET order_status = 'CANCELLED' WHERE order_status = 'PENDING' AND order_date < NOW() - INTERVAL 48 HOUR;` | **Manager Dashboard & Customer Orders**: Stale orders change status to "CANCELLED" automatically. | `database/06_events.sql` | **Q: What is the business rationale behind canceling orders after 48 hours?**<br>**A:** Prevents unpaid orders from indefinitely locking up delivery slots and operational bandwidth. |

---

## 6. Database Accounts, Privileges & Security Architecture (Principle of Least Privilege)

| Database Account / Role | Business Purpose & Security Level | Explicit MySQL Privileges Granted (`GRANT ...`) | Frontend Screen & Access Control (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`supermart_admin`@`%`**<br>(Role 1: `ROLE_ADMIN`) | **Full System & Schema Administrator**:<br>Highest security level. Responsible for DDL, disaster recovery, security auditing, and provisioning operational staff accounts. | `GRANT ALL PRIVILEGES ON supermart_db.* TO 'supermart_admin'@'%' WITH GRANT OPTION;` | **Admin Dashboard**:<br>1. Executive KPI Summary.<br>2. Monthly revenue reports.<br>3. "Operational Managers" tab (create, toggle active/inactive). | **Frontend:** `frontend/src/components/AdminDashboard.jsx`<br>**Controller:** `backend/.../AdminController.java`<br>**DAO:** `backend/.../UserDao.java`, `AnalyticsDao.java`<br>**DB:** `database/08_db_users_security.sql` | **Q: Why does only `supermart_admin` have `WITH GRANT OPTION` and DDL rights?**<br>**A:** To maintain strict separation of duties. Only the DBA/Admin can alter schema structure (`CREATE`, `ALTER`, `DROP`) or grant permissions to other database accounts. |
| **`supermart_manager`@`%`**<br>(Role 2: `ROLE_MANAGER`) | **Operational Staff Account**:<br>Enforces Least Privilege. Manages catalog inventory, edits retail pricing, restocks products, progresses order statuses, and creates coupons. | 1. `GRANT SELECT, INSERT, UPDATE ON products`<br>2. `GRANT SELECT, INSERT, UPDATE ON coupons`<br>3. `GRANT SELECT, UPDATE ON orders`<br>4. `GRANT SELECT ON order_items`<br>5. `GRANT SELECT, UPDATE ON stock_alerts`<br>6. `GRANT EXECUTE ON PROCEDURE sp_restock_product`<br>7. `GRANT SELECT ON v_low_stock_alerts`<br>8. `GRANT SELECT ON v_active_product_catalog` | **Manager Dashboard**:<br>1. Inventory & Restock Table.<br>2. Low Stock Warnings tab.<br>3. Coupon Management tab.<br>4. Order Dispatch Status tracking. | **Frontend:** `frontend/src/components/ManagerDashboard.jsx`<br>**Controller:** `backend/.../ProductController.java`, `OrderController.java`, `CouponController.java`<br>**DAO:** `backend/.../ProductDao.java`, `OrderDao.java`, `CouponDao.java`<br>**DB:** `database/08_db_users_security.sql` | **Q: Can an Operational Manager delete orders or drop tables?**<br>**A:** **No.** Managers are denied `DELETE` privileges on `orders` and have zero DDL rights (`DROP`, `ALTER`). They can only update order statuses (`PENDING -> CONFIRMED -> SHIPPED -> DELIVERED`) and restock products through the sanctioned procedure `sp_restock_product`. |
| **`supermart_customer`@`%`**<br>(Role 3: `ROLE_CUSTOMER`) | **Public Client / Application Account**:<br>High-security least privilege profile for web customers. Can browse catalog, manage personal addresses, place orders, and apply coupons. | 1. `GRANT SELECT ON roles, categories, brands, coupons`<br>2. `GRANT SELECT, INSERT, UPDATE ON users`<br>3. `GRANT SELECT, INSERT, UPDATE, DELETE ON customer_addresses`<br>4. `GRANT SELECT, INSERT ON order_items`<br>5. `GRANT SELECT, INSERT, UPDATE ON orders, payments`<br>6. `GRANT INSERT ON audit_logs`<br>7. `GRANT EXECUTE ON PROCEDURE sp_register_customer, sp_add_customer_address, sp_place_order_transaction` | **Customer Web Application**:<br>1. Catalog Grid ([CustomerHome.jsx](file:///e:/adbms/adbms/frontend/src/components/CustomerHome.jsx)).<br>2. Cart Drawer ([CartDrawer.jsx](file:///e:/adbms/adbms/frontend/src/components/CartDrawer.jsx)).<br>3. Multi-step Checkout ([CheckoutModal.jsx](file:///e:/adbms/adbms/frontend/src/components/CheckoutModal.jsx)).<br>4. Order Receipts ([ReceiptModal.jsx](file:///e:/adbms/adbms/frontend/src/components/ReceiptModal.jsx)). | **Frontend:** `frontend/src/components/CustomerHome.jsx`, `CheckoutModal.jsx`<br>**Controller:** `backend/.../AuthController.java`, `OrderController.java`, `AddressController.java`<br>**DAO:** `backend/.../UserDao.java`, `OrderDao.java`, `AddressDao.java`<br>**DB:** `database/08_db_users_security.sql` | **Q: How does this satisfy the Principle of Least Privilege (PoLP)?**<br>**A:** The customer account cannot modify stock levels directly (`products.current_stock` is updated strictly via the database trigger on `order_items`), cannot access administrative stored procedures (`sp_create_operational_manager`), and cannot delete historical audit logs. |

---

## 7. Master System Audit Trail & Security Ledger Architecture

| Audit Event / Source Mechanism | Action Type & Target Table | Business Purpose (Why we audit this?) | What is automatically written to `audit_logs` | Frontend Screen (Where to show lecturer) | End-to-End File Trace (Frontend -> Backend -> DB) | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Price Modification Audit**<br>(Trigger: `trg_before_product_price_audit`) | `UPDATE`<br>Table: `products` | Fraud prevention & price integrity: Prevents staff from secretly altering retail selling prices. | `Price change for [Product]: Old LKR [OldPrice] -> New LKR [NewPrice]` | **Manager Dashboard**: Update price modal $\rightarrow$ instantly appears in **Admin Audit Trail tab**. | **Trigger:** `05_triggers.sql`<br>**Controller:** `ProductController.java`<br>**DAO:** `ProductDao.java`<br>**Frontend:** `ManagerDashboard.jsx` & `AdminDashboard.jsx` | **Q: Why use a BEFORE trigger?**<br>**A:** Captures old price safely before the update row changes are committed to disk. |
| **User Registration Audit**<br>(Trigger: `trg_after_user_insert_audit`) | `INSERT`<br>Table: `users` | Compliance & accountability: Tracks who created accounts and assigns role accountability. | `User created: [Username] (Role ID: [RoleID])` | **Admin Dashboard**: "System Audit Trail" tab shows new customer/manager entry. | **Trigger:** `05_triggers.sql`<br>**Controller:** `AuthController.java`<br>**DAO:** `UserDao.java`<br>**Frontend:** `AuthModal.jsx` & `AdminDashboard.jsx` | **Q: Does this log both customers and managers?**<br>**A:** Yes, any INSERT into `users` table fires this trigger and records the role ID. |
| **Order Status Progression Audit**<br>(Trigger: `trg_after_order_status_update_audit`) | `UPDATE`<br>Table: `orders` | Order delivery tracking & dispute resolution: Tracks order state changes across staff. | `Order [OrderNumber] changed status from [OldStatus] to [NewStatus]` | **Manager Dashboard**: Order status change $\rightarrow$ appears in **Admin Audit Trail tab**. | **Trigger:** `05_triggers.sql`<br>**Controller:** `OrderController.java`<br>**DAO:** `OrderDao.java`<br>**Frontend:** `ManagerDashboard.jsx` & `AdminDashboard.jsx` | **Q: Why is status tracking important?**<br>**A:** Provides non-repudiation proof of who dispatched or delivered an order. |
| **Product Restocking Audit**<br>(Procedure: `sp_restock_product`) | `UPDATE`<br>Table: `products` | Inventory loss prevention: Records manager identity and quantity added during restock. | `Restocked product ID [ID] by [Qty] units` | **Manager Dashboard**: Restock modal $\rightarrow$ reflected in **Admin Audit Trail tab**. | **Procedure:** `04_procedures.sql`<br>**Controller:** `ProductController.java`<br>**DAO:** `ProductDao.java`<br>**Frontend:** `ManagerDashboard.jsx` & `AdminDashboard.jsx` | **Q: How does this prevent inventory theft?**<br>**A:** Restocking is strictly tied to a logged-in manager's `user_id` and logged in audit trail. |
| **Order Checkout Audit**<br>(Procedure: `sp_place_order_transaction`) | `CHECKOUT`<br>Table: `orders` | Financial auditing: Records successful checkout transactions and net billing amounts. | `Placed order [OrderNum] for LKR [TotalAmount]` | **Checkout Modal**: "Place Order" $\rightarrow$ generates immutable audit entry. | **Procedure:** `04_procedures.sql`<br>**Controller:** `OrderController.java`<br>**DAO:** `OrderDao.java`<br>**Frontend:** `CheckoutModal.jsx` & `AdminDashboard.jsx` | **Q: What table stores these logs?**<br>**A:** Central `audit_logs` table indexed with `idx_audit_created` and `idx_audit_action`. |
| **Daily Sales Snapshot Audit**<br>(Event: `evt_daily_audit_snapshot`) | `SNAPSHOT`<br>Table: `orders` | Executive ledger: Automatic daily financial summary taken at midnight. | `Daily Summary: Total orders: [N], Revenue: LKR [TotalRev]` | **Admin Dashboard**: System Audit Trail tab shows daily snapshot summary. | **Event:** `06_events.sql`<br>**Storage:** `audit_logs`<br>**Frontend:** `AdminDashboard.jsx` | **Q: Why use an automated Event?**<br>**A:** Runs autonomously inside MySQL without requiring any admin to manually click generate. |
| **Audit Log Data Retention**<br>(Event: `evt_monthly_purge_old_audit_logs`) | `PURGE`<br>Table: `audit_logs` | Performance optimization: Purges records older than 180 days to prevent disk exhaustion. | Automatically executes: `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL 180 DAY;` | **Database Storage Management** | **Event:** `06_events.sql`<br>**DB File:** `database/06_events.sql` | **Q: Why retain logs for 180 days?**<br>**A:** Complies with 6-month statutory accounting standards while keeping queries fast. |

---

## 8. ACID Transactions Architecture & Rollback Proof

| Transaction Name & Procedure | ACID Properties Enforced | Multi-Table Atomic Operations | Rollback Mechanism (`EXIT HANDLER`) | How to Show in Frontend | How to Show in MySQL Workbench | Key Lecturer / Viva Q&A |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Transaction 1: Order Placement & Checkout Transaction**<br>([sp_place_order_transaction](file:///e:/adbms/adbms/database/04_procedures.sql#L141-L211)) | **Atomicity**: All tables update or all rollback.<br>**Consistency**: Stock never drops below zero.<br>**Isolation**: `REPEATABLE READ` / Row lock.<br>**Durability**: Written to InnoDB redo logs. | 1. Calculate coupon discount.<br>2. Calculate delivery charge.<br>3. Insert into `orders`.<br>4. Insert into `payments`.<br>5. Insert into `order_items`.<br>6. Deduct stock (via trigger).<br>7. Insert into `audit_logs`. | `DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; SET p_order_id = -1; SET p_status_msg = 'Transaction Failed'; END;` | Customer logs in $\rightarrow$ adds items to cart $\rightarrow$ proceeds to checkout $\rightarrow$ clicks **"Place Order"**. Receipt modal pops up. | Run:<br>`CALL sp_place_order_transaction(3, 1, 'FREEDEL3000', 'CASH_ON_DELIVERY', 3500.00, @id, @num, @msg);`<br>`SELECT @id, @num, @msg;` | **Q: What happens if payment fails?**<br>**A:** The `SQLEXCEPTION` exit handler fires `ROLLBACK`, guaranteeing no order or stock deduction is preserved. |
| **Transaction 2: Order Cancellation & Stock Compensation**<br>([sp_cancel_order_transaction](file:///e:/adbms/adbms/database/10_audit_logs_and_transactions.sql#L72-L138)) | **Atomicity**: Order status, payment refund, and stock restoration occur together.<br>**Consistency**: Stock accurately replenished.<br>**Isolation**: `FOR UPDATE` pessimistic row lock.<br>**Durability**: Persisted in InnoDB. | 1. Lock order row with `FOR UPDATE`.<br>2. Restore inventory quantities in `products`.<br>3. Set `orders.order_status = 'CANCELLED'`.<br>4. Set `payments.payment_status = 'REFUNDED'`.<br>5. Insert cancellation entry in `audit_logs`. | Manager or Customer clicks "Cancel Order" $\rightarrow$ order status badges update to CANCELLED and stock increases. | Run:<br>`CALL sp_cancel_order_transaction(1, 1, 'Customer cancellation', @status);`<br>`SELECT @status;` | **Q: What is a Compensating Transaction?**<br>**A:** A transaction that reverses the financial and inventory effects of a previously committed transaction. |
| **Transaction 3: Controlled Rollback Verification Proof**<br>(Integrity Constraint Test) | **Atomicity & Consistency**: Proves database refuses invalid state and restores original state. | Attempts invalid stock alteration. Database integrity trigger `trg_before_product_stock_check` throws `SIGNAL SQLSTATE '45000'`. | Explicit `ROLLBACK;` cancels uncommitted changes. Original stock remains unchanged. | If cart quantity exceeds inventory, UI validation blocks it. | Run in Workbench:<br>`START TRANSACTION;`<br>`UPDATE products SET current_stock = -50 WHERE product_id = 1;`<br>*(Fails with Error 1644)*<br>`ROLLBACK;` | **Q: How does this prove ACID Atomicity?**<br>**A:** Proves that an invalid update is stopped in its tracks and completely reverted, leaving zero corrupt data on disk. |

---

## 9. How the Entire System Works Together (Life of an Order)

Here is the exact lifecycle you can describe to your lecturer:

```
[Customer on Frontend]
       │
       ▼
1. Browses products from View: v_active_product_catalog
       │
2. Validates stock via Function: fn_is_product_in_stock
       │
3. Adds delivery address via Stored Procedure: sp_add_customer_address
       │
4. Selects active coupon from View: v_active_coupons
       │
5. Clicks "Place Order" (Frontend -> POST /api/orders)
       │
       ▼
[Backend Spring Boot & Database Engine]
       │
6. Executes Stored Procedure: sp_place_order_transaction (ACID Transaction)
       ├─ Calls Function: fn_calculate_coupon_discount (Computes savings)
       ├─ Calls Function: fn_calculate_delivery_fee (Rs. 0 if >3000, else Rs. 350)
       ├─ Inserts into orders and payments tables
       └─ Inserts into audit_logs table
       │
7. Inserts line items into order_items
       │
8. Trigger fires: trg_after_order_item_insert_deduct_stock
       └─ Automatically reduces products.current_stock
       │
9. If stock drops below threshold:
       └─ Trigger fires: trg_after_product_stock_update_alert (creates record in stock_alerts)
       │
10. Trigger checks integrity: trg_before_product_stock_check (blocks negative stock)
       │
       ▼
[Manager & Admin Follow-up]
       │
11. Manager views low stock via View: v_low_stock_alerts
12. Manager restocks via Stored Procedure: sp_restock_product
13. Hourly Event: evt_hourly_stock_alert_check marks alert as resolved
14. Admin reviews revenue trends via View: v_daily_sales_summary & View: v_top_selling_products
15. Admin generates month-end report via Stored Procedure: sp_generate_monthly_report
```

---

## 10. Master Summary: 30 Database Objects & Application Usage Status

Every database category in this project contains exactly **six (6)** objects, totaling **30 database objects**. Below is the quick reference indicating whether each object is actively called by the Spring Boot backend / React frontend, called internally by procedures, or maintained as a standalone database utility.

### A. The Six (6) Views (`database/02_views.sql`)
| View Name | Used in App? | Backend DAO / Query | Frontend Component / Page |
| :--- | :---: | :--- | :--- |
| **`v_active_product_catalog`** | **YES** | `ProductDao.java` (`getActiveProductCatalog`) | Customer Home catalog grid & category filters |
| **`v_low_stock_alerts`** | **YES** | `ProductDao.java` (`getLowStockAlerts`) | Manager Dashboard ("Low Stock Alerts" table) |
| **`v_customer_order_history`** | **YES** | `OrderDao.java` (`getOrdersByUserId`, `getAllOrders`) | Customer Order History & Manager Order Tracking |
| **`v_daily_sales_summary`** | **YES** | `AnalyticsDao.java` (`getDailySalesTrends`) | Admin Dashboard Daily Sales trend chart |
| **`v_top_selling_products`** | **YES** | `AnalyticsDao.java` (`getTopSellingProducts`) | Admin Dashboard Top Selling Products Leaderboard |
| **`v_active_coupons`** | **YES** | `CouponDao.java` (`getActiveCoupons`) | Customer Checkout Modal ("Available Coupons" list) |

### B. The Six (6) Stored Functions (`database/03_functions.sql`)
| Function Name | Used in App? | Calling Mechanism | Explanation & Usage Context |
| :--- | :---: | :--- | :--- |
| **`fn_calculate_coupon_discount`** | **YES** | Called inside `sp_place_order_transaction` | Computes percentage discount if subtotal meets minimum order requirement. |
| **`fn_calculate_delivery_fee`** | **YES** | Called inside `sp_place_order_transaction` | Returns Rs. 0.00 for orders ≥ Rs. 3,000 or eligible coupon; Rs. 350.00 otherwise. |
| **`fn_customer_lifetime_spending`** | **YES** | Queried via `AnalyticsDao.java` | Displays customer's total historical spend badge in `ProfileModal.jsx`. |
| **`fn_validate_nic_format`** | **YES** | Called inside `sp_create_operational_manager` | Validates Sri Lankan 9-digit+V/X or 12-digit NIC formats before inserting managers. |
| **`fn_is_product_in_stock`** | **STANDALONE** | Database Utility | Reusable scalar stock validator. In the web app, stock availability is checked directly against `v_active_product_catalog`. |
| **`fn_get_order_total_items`** | **STANDALONE** | Database Utility | Sums order item quantities. In the web app, line item counts are calculated directly from line items in memory. |

### C. The Six (6) Stored Procedures (`database/04_procedures.sql`)
| Procedure Name | Used in App? | Backend DAO Method | Frontend Trigger |
| :--- | :---: | :--- | :--- |
| **`sp_register_customer`** | **YES** | `UserDao.java` (`registerCustomer`) | Customer Registration form submit |
| **`sp_create_operational_manager`** | **YES** | `UserDao.java` (`createOperationalManager`) | Admin "Add Operational Manager" form submit |
| **`sp_restock_product`** | **YES** | `ProductDao.java` (`restockProduct`) | Manager Dashboard "Restock" button click |
| **`sp_add_customer_address`** | **YES** | `AddressDao.java` (`addAddress`) | Checkout Step 1 "Save Address" button click |
| **`sp_place_order_transaction`** | **YES** | `OrderDao.java` (`placeOrderTransaction`) | Checkout Step 3 "Place Order" button click |
| **`sp_generate_monthly_report`** | **YES** | `AnalyticsDao.java` (`generateMonthlyReport`) | Admin Dashboard "Generate Report" button click |

### D. The Six (6) Database Triggers (`database/05_triggers.sql`)
| Trigger Name | Event & Table | Automatic Action Performed |
| :--- | :--- | :--- |
| **`trg_after_order_item_insert_deduct_stock`** | `AFTER INSERT ON order_items` | Deducts product `current_stock` when line items are added to an order. |
| **`trg_after_product_stock_update_alert`** | `AFTER UPDATE ON products` | Generates a new warning row in `stock_alerts` when stock hits `min_stock_level`. |
| **`trg_before_product_price_audit`** | `BEFORE UPDATE ON products` | Logs previous and updated unit prices to `audit_logs` before price changes commit. |
| **`trg_after_user_insert_audit`** | `AFTER INSERT ON users` | Automatically records an `INSERT` audit event when a customer or manager registers. |
| **`trg_before_product_stock_check`** | `BEFORE UPDATE ON products` | Enforces data integrity: Throws `SQLSTATE '45000'` error if stock drops below 0. |
| **`trg_after_order_status_update_audit`** | `AFTER UPDATE ON orders` | Logs order status transitions (`PENDING` → `CONFIRMED` → `DELIVERED`) to `audit_logs`. |

### E. The Six (6) Scheduled Events (`database/06_events.sql`)
| Event Name | Frequency | Automatic Server Task |
| :--- | :--- | :--- |
| **`evt_daily_cleanup_expired_coupons`** | `EVERY 1 DAY` | Deactivates expired promotional coupons (`is_active = FALSE`). |
| **`evt_hourly_stock_alert_check`** | `EVERY 1 HOUR` | Auto-resolves records in `stock_alerts` once products have been restocked. |
| **`evt_daily_audit_snapshot`** | `EVERY 1 DAY` | Takes a daily midnight snapshot of orders and total revenue, logging into `audit_logs`. |
| **`evt_monthly_purge_old_audit_logs`** | `EVERY 1 MONTH` | Purges audit records older than 180 days to maintain fast query execution. |
| **`evt_weekly_zero_stock_flag`** | `EVERY 1 WEEK` | Logs warning entries for catalog products that have remained at 0 stock for > 14 days. |
| **`evt_cancel_stale_pending_orders`** | `EVERY 1 DAY` | Automatically cancels unpaid pending orders that have remained inactive > 48 hours. |

---

## 11. ACID Transactions Architecture & Implementation Reference

Transactions guarantee that business operations involving multiple database tables maintain absolute consistency and reliability according to **ACID** principles.

### Key Transactions in SuperMart:
1. **Order Checkout Transaction (`sp_place_order_transaction`)**:
   - **Atomicity**: The checkout operation involves inserting the order header into `orders`, inserting the payment transaction into `payments`, inserting line items into `order_items`, decrementing stock via trigger, and recording an entry into `audit_logs`. If any of these steps fails (e.g. invalid payment or DB failure), the entire operation rolls back completely using `DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; ... END;`.
   - **Consistency**: Stock cannot drop below zero due to `trg_before_product_stock_check`. Foreign key constraints between `orders`, `users`, and `payments` are strictly preserved.
   - **Isolation**: Standard MySQL InnoDB `REPEATABLE READ` isolation level prevents dirty reads while concurrent customers place orders.
   - **Durability**: Once `COMMIT` executes, all state changes are permanently written to InnoDB redo logs on disk.

2. **Compensating Cancellation Transaction (`sp_cancel_order_transaction`)**:
   - Safely rolls back the effects of a confirmed order by reversing inventory deduction (`UPDATE products SET current_stock = current_stock + qty`), updating payment status to `REFUNDED`, updating order status to `CANCELLED`, and inserting a cancellation audit record.

3. **Controlled Rollback Test (Integrity Constraint)**:
   - Attempting to force negative stock via `UPDATE products SET current_stock = -10` triggers `SIGNAL SQLSTATE '45000'`, forcing an immediate error and demonstrating automatic transaction abort.

---

## 12. Master System Audit Trail & Security Ledger Reference

The SuperMart audit system records all critical administrative, managerial, and system events in the `audit_logs` table for compliance, security, and dispute resolution.

### A. The 4 Audit Action Filters
1. **`INSERT`**: Records account creation for new customers, operational managers, and administrative users.
2. **`UPDATE`**: Records modifications to product retail prices, inventory restocks, and order delivery status progressions.
3. **`CHECKOUT`**: Records customer order placements along with the total billing amount.
4. **`OTHER`**: Captures autonomous system background events:
   - **`SNAPSHOT`**: Daily sales summaries generated automatically at midnight by scheduled event `evt_daily_audit_snapshot`.
   - **`WARNING`**: Alerts generated for long-standing depleted products (0 stock for > 14 days) by `evt_weekly_zero_stock_flag`.

### B. Audit Trail Columns & Attribution ("Who Did It")
- **Actor Attribution**: Every audit entry clearly attributes responsibility:
  - If performed by the Super Admin (e.g., adding an Operational Manager), it shows `Super Admin` with their name.
  - If performed by an Operational Manager (e.g., restocking or price updates), it shows the manager's name and ID.
  - If performed by a customer during checkout, it attributes the customer.
  - If generated by background scheduled events (`SNAPSHOT`, `WARNING`), it attributes `Automated System Event`.
- **Timestamping & Timezone**: Timestamps are stored in UTC format in the database and formatted directly to the user's local Sri Lankan time (`Asia/Colombo`, UTC+05:30) in the dashboard.
- **Data Lifecycle**: Audit logs are retained for 180 days for statutory regulatory compliance and automatically purged thereafter via `evt_monthly_purge_old_audit_logs`.

