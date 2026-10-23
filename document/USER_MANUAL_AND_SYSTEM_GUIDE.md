# SUPERMART ONLINE — USER MANUAL & SYSTEM VERIFICATION GUIDE
## ICT3222 Advanced Database Management Systems Mini Project

---

## 1. System Overview & Technology Stack

**SuperMart Online** is an enterprise-grade online grocery supermarket platform built to fulfill all requirements of the ICT3222 Advanced Database Management Systems Mini Project.

### 1.1 Technology Stack & Architectural Decisions
- **Database**: MySQL 8.0 / 9.x (`supermart_db`)
  - 12 Normalized Tables (3NF).
  - 6 Views, 6 Stored Procedures, 6 Stored Functions, 6 Triggers, 6 Scheduled Events.
  - Performance B-Tree Indexes & ACID Transaction Rollback mechanisms.
  - 3 Dedicated Database Security Accounts (`supermart_admin`, `supermart_manager`, `supermart_customer`).
- **Backend Application**: Spring Boot (Java 23 / 21)
  - **Strict Pure JDBC** (`JdbcTemplate`, `NamedParameterJdbcTemplate`, `SimpleJdbcCall`, `RowMapper`).
  - **Strictly NO ORM / NO JPA / NO Hibernate**: Zero ORM overhead, with raw SQL queries executing directly on the database engine.
  - Programmatic `@Transactional` boundaries guaranteeing ACID consistency.
- **Frontend Presentation**: React 19 + Tailwind CSS + Vite
  - Cohesive Supermarket Design: Emerald Green (`#059669` / `#10b981`), Clean Black/Slate (`#0f172a`), and Crisp White.
  - Fully responsive across desktop, tablet, and mobile devices.
  - Three (3) dedicated role dashboards: **Customer**, **Operational Manager**, and **Super Admin**.

---

## 2. Running Services & URLs

Both servers are currently active and running locally on your system:

| Service | Local Address | Technology | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **`http://localhost:5173/`** | React + Tailwind CSS (Vite) | **Running** |
| **Backend REST API** | **`http://localhost:8080/`** | Spring Boot Pure JDBC (Tomcat) | **Running** |
| **Database Server** | **`localhost:3306`** | MySQL 9.2 (`supermart_db`) | **Connected** |

---

## 3. Seed Accounts & Login Credentials

All users and initial data are pre-populated in your MySQL database:

| Role | Username (Login ID) | Password | Access Rights & Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | **`admin`** | **`admin123`** | Full system control, analytics, audit log inspection, manager onboarding, monthly report generator. **Can change username & password anytime**. |
| **Operational Manager** | **`0771234567`** | **`manager123`** | Inventory stock management, product price updates, coupon creation, order fulfillment. **Username is locked to mobile phone**. |
| **Customer (Existing)** | **`kamal@gmail.com`** *or* **`0719876543`** | **`customer123`** | Grocery shopping, cart, 3-section checkout, coupon application, order history. |
| **Customer (New)** | *Self-Register* | *Self-Created* | Any visitor can register via the registration form. |

---

## 4. Step-by-Step System Verification Walkthrough

Follow these steps in your browser at `http://localhost:5173/` to test every feature of the system:

---

### Phase 1: Customer Experience & 3-Section Checkout

1. **Browse Products**:
   - Open `http://localhost:5173/`.
   - The homepage displays live products queried from MySQL View **`v_active_product_catalog`**.
   - Notice the prices: Vegetables and fruits show **`Rs. X / 100g`**; milk and bread show **`Rs. Y / unit`**.
   - Notice the dynamic stock badges: **"In Stock"** (green) vs **"Out of Stock"** (e.g. Red Bell Peppers).

2. **Test Search & Filtering**:
   - Type `Anchor` or `Munchee` into the search bar to filter by brand.
   - Click category filter buttons (`Fresh Vegetables`, `Dairy & Eggs`, `Beverages & Tea`).
   - Use the brand dropdown to filter by specific brand names.

3. **Dynamic Quantity Price Calculator**:
   - On any product card (e.g., *Organic Red Carrots* at Rs. 45.00/100g), click the **`+`** button.
   - Watch the quantity increase (200g, 300g, 400g) and the **Calculated Total** update in real-time.

4. **Sign In / Registration (Dual Login)**:
   - Click **"Sign In"** or click on any product card.
   - Test logging in using the **Mobile Phone Number**: `0719876543` and password: `customer123`.
   - *(Alternatively, click "Register" and create a new customer. Notice the client-side and database validations for a 10-digit phone and 8-character password. On success, it automatically navigates to login)*.

5. **Shopping Cart Drawer**:
   - Click **"Add to Cart"** on 1 or 2 items.
   - The sliding Cart Drawer opens from the right.
   - You can increase/decrease quantities or delete items; the Subtotal dynamically recalculates.
   - Click **"Proceed to Checkout"**.

6. **The 3-Section Checkout Flow**:
   - **Section 1: Delivery Address**:
     - Customer name (`Kamal Silva`) and mobile phone (`0719876543`) are **automatically pre-filled**.
     - Input address details (e.g. `No 10, Galle Road`, City: `Colombo`).
     - Click **"Save & Proceed to Payment"** (invokes MySQL Stored Procedure **`sp_add_customer_address`**).
   - **Section 2: Payment Method Selection**:
     - Choose **Cash on Delivery (COD)** or **Credit / Debit Card**.
     - If Card is selected, enter 16-digit card details, MM/YY expiry, and CVV.
     - Click **"Proceed to Review & Coupons"**.
   - **Section 3: Promotional Coupons & Order Summary**:
     - Click **"View Available Coupons"** to view database coupons.
     - Test applying **`FREEDEL3000`**:
       - If subtotal >= Rs. 3,000: delivery charge becomes **FREE** (Rs. 0.00).
     - Test applying **`SAVE10PLUS`**:
       - If subtotal >= Rs. 5,000: applies **10% discount** + **FREE delivery**.
     - Review the net total bill.
   - Click **"Confirm Order & Pay"**:
     - Executes an atomic **ACID Transaction** calling **`sp_place_order_transaction`**.
     - Database triggers **`trg_after_order_item_insert_deduct_stock`** and **`trg_before_product_stock_check`** automatically deduct stock from MySQL and verify non-negative inventory.

7. **Invoice / Customer Receipt**:
   - The **Receipt Modal** opens showing the official invoice with Order Number, customer details, itemized breakdown, discounts, delivery charge, and payment status.
   - Click **"Print Receipt"** to test browser printing.

8. **Customer Order History**:
   - Click **"My Orders"** in the top navigation.
   - Displays all past orders loaded from MySQL View **`v_customer_order_history`**.
   - Click your profile badge to see your **Customer Lifetime Value** calculated via Stored Function **`fn_customer_lifetime_spending`**.

---

### Phase 2: Operational Manager Portal

1. **Log In as Operational Manager**:
   - Sign out from Customer.
   - Click **"Sign In"**.
   - Username = **`0771234567`** (Manager mobile phone).
   - Password = **`manager123`**.

2. **Inventory Stock Management & Restock**:
   - The Manager Portal displays all products with live stock counts and minimum alert levels.
   - Find any product with low stock (or 0 stock like *Red Bell Peppers*).
   - Click **"Restock"**:
     - Enter additional units (e.g., `50`).
     - Click **"Execute Restock"**.
     - Calls MySQL Stored Procedure **`sp_restock_product`** and updates stock immediately.

3. **Low Stock Alerts**:
   - Click the **"Low Stock Alerts"** tab.
   - Displays items populated from MySQL View **`v_low_stock_alerts`** with units needed.

4. **Product Price Updates (Audit Trigger)**:
   - On the Inventory tab, click **"Edit Price"** on any product.
   - Change the price (e.g. from Rs. 45 to Rs. 50).
   - Click **"Save & Trigger Audit"**.
   - MySQL Trigger **`trg_before_product_price_audit`** automatically writes the old price and new price into `audit_logs`!

5. **Coupons Management**:
   - Click the **"Coupons & Promotions"** tab.
   - View all existing coupons.
   - Click **"Create New Coupon"** to add a new seasonal promotional code.

6. **Order Fulfillment**:
   - Click the **"Customer Orders"** tab.
   - Change order status from `PENDING` → `PROCESSING` → `DELIVERED`.
   - MySQL Trigger **`trg_after_order_status_update_audit`** logs every state change.

7. **Profile Update Constraints**:
   - Click the profile avatar.
   - Notice that First Name, Last Name, Email, and Password can be changed, but **Username is strictly locked** to the mobile number assigned by the admin.

---

### Phase 3: Super Admin Console

1. **Log In as Super Admin**:
   - Sign out from Manager.
   - Click **"Sign In"**.
   - Username = **`admin`**.
   - Password = **`admin123`**.

2. **KPI Analytics Dashboard**:
   - Live metrics display Total Revenue, Total Orders, Customers count, Managers count, and Products count.
   - **Top Selling Products**: Queried from MySQL View **`v_top_selling_products`**.
   - **Daily Sales Summary**: Queried from MySQL View **`v_daily_sales_summary`**.

3. **Create Operational Manager**:
   - Click the **"Operational Managers"** tab.
   - Click **"Add Operational Manager"**.
   - Form inputs: First Name, Last Name, Email, NIC Number, Mobile Phone, Gender.
   - **Notice the Auto-Fill**: As you type the 10-digit mobile phone, it is automatically assigned as their Username.
   - Input initial password (minimum 8 characters).
   - Click **"Create Manager"**.
   - Calls MySQL Stored Procedure **`sp_create_operational_manager`** (which validates Sri Lankan NIC format using Stored Function **`fn_validate_nic_format`**).
   - MySQL Trigger **`trg_after_user_insert_audit`** logs the new manager into the audit trail.

4. **Master System Audit Trail**:
   - Click the **"System Audit Trail"** tab.
   - Displays all historical records from table **`audit_logs`**.
   - You can see:
     - `INSERT` logs for newly registered customers and managers.
     - `UPDATE` logs for product price changes with old vs new price.
     - `CHECKOUT` logs for customer order placements.
     - Order status transition logs.

5. **Monthly Revenue Report Generator**:
   - Click the **"Monthly Revenue Report"** tab.
   - Select Year: `2026`, Month: `10`.
   - Click **"Generate Report"**.
   - Calls MySQL Stored Procedure **`sp_generate_monthly_report`** and displays Total Orders, Gross Subtotal, Discounts Given, and Net Realized Revenue.

6. **Admin Master Credentials Modification**:
   - Click the profile icon in the navbar.
   - Notice that unlike the Manager or Customer, the Admin **can change their own Username and Password at any time**.

---

## 5. How to Explain the Code to Your Lecturer

When demonstrating this project for your evaluation, explain the following technical points:

### 1. Pure JDBC Architecture (NO ORM)
- Point to `e:/adbms/adbms/backend/src/main/java/com/supermart/backend/dao/`:
  - Show that there are **zero** JPA/Hibernate annotations (`@Entity`, `@Table`, `@Id`).
  - Explain that all database communication uses Spring's **`JdbcTemplate`** with raw SQL `PreparedStatements` and custom `RowMapper` implementations.
  - This eliminates ORM overhead and gives 100% control over query performance and indexing.

### 2. ACID Transactions & Rollback
- Point to `OrderDao.java` (`placeOrder` method):
  - Explain that order placement is wrapped in `@Transactional`.
  - The method calls MySQL Stored Procedure `sp_place_order_transaction` which starts with `START TRANSACTION` and includes an exit handler:
    ```sql
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = -1;
        SET p_status_msg = 'Transaction Failed: Rolled back successfully';
    END;
    ```
  - If any failure occurs during stock deduction or payment logging, MySQL rolls back the entire transaction, preserving database integrity.

### 3. The 6 Advanced Database Concepts
- **Views**: Explain how `v_active_product_catalog` pre-joins categories and brands and computes stock status, abstracting query complexity from the application.
- **Stored Procedures**: Show `sp_create_operational_manager` and explain how business logic (NIC validation and username assignment) is encapsulated inside MySQL.
- **Stored Functions**: Explain `fn_is_product_in_stock`, `fn_calculate_delivery_fee`, and `fn_customer_lifetime_spending` as reusable deterministic routines.
- **Triggers**: Show `trg_after_order_item_insert_deduct_stock` and `trg_before_product_price_audit` demonstrating automated stock adjustment and price auditing without requiring backend intervention.
- **Scheduled Events**: Point to `evt_daily_cleanup_expired_coupons` and `evt_cancel_stale_pending_orders` as autonomous background database maintenance jobs.
- **Security & Privileges**: Explain the 3 database user accounts (`supermart_admin`, `supermart_manager`, `supermart_customer`) enforcing the **Principle of Least Privilege**.
