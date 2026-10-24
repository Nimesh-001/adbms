# 🚀 SuperMart Quick Start & Restart Guide

This guide provides simple, copy-paste instructions to restart the system whenever it stops due to cloud inactivity or when running locally.

---

## ☁️ Part 1: How to Restart the Hosted Cloud System (GitHub Codespaces)

When your GitHub Codespaces session goes to sleep after inactivity, follow these **3 simple steps** to bring the entire system back online:

### Step 1: Open Your Codespace
1. Go to your repository: **[github.com/Nimesh-001/adbms](https://github.com/Nimesh-001/adbms)**.
2. Click the green **`<> Code`** button $\rightarrow$ click the **"Codespaces"** tab.
3. Click your existing codespace to reopen it.

---

### Step 2: Start the Servers in Two Cloud Terminals

#### Terminal 1 (Backend - Spring Boot):
1. Open a terminal in Codespaces (`Terminal` $\rightarrow$ `New Terminal`).
2. Paste and run this command:
```bash
cd /workspaces/adbms/backend
export SPRING_DATASOURCE_URL="jdbc:mysql://mysql-2afde5e6-nimeshsanka56-6e04.e.aivencloud.com:18080/supermart_db?sslmode=require"
export SPRING_DATASOURCE_USERNAME="avnadmin"
export SPRING_DATASOURCE_PASSWORD="<YOUR_AIVEN_PASSWORD>"
./mvnw spring-boot:run
```
*Wait until you see:* `Started BackendApplication in X.XXX seconds`.

#### Terminal 2 (Frontend - Vite React):
1. Open a second terminal (click the **`+`** icon on the top right of the terminal panel).
2. Paste and run this command:
```bash
cd /workspaces/adbms/frontend
npm run dev
```
*Wait until you see:* `VITE v8.3.4 ready in XXX ms`.

---

### Step 3: Set Ports to Public & Open Your Live Site

1. In Codespaces, click the **"PORTS"** tab at the bottom (next to Terminal).
2. Check the **Port Visibility** column:
   - Right-click Port **`8080`** $\rightarrow$ **Port Visibility** $\rightarrow$ select **Public**.
   - Right-click Port **`5173`** $\rightarrow$ **Port Visibility** $\rightarrow$ select **Public**.
3. **Open the site:**
   - Click the **Globe icon (Open in Browser)** on Port **`5173`**, or open:
     ```text
     https://<your-codespace-name>-5173.app.github.dev/
     ```
4. If GitHub prompts you with a one-time message saying *"You are accessing a forwarded port"*, click **"Continue"**.
5. Your live SuperMart store will load with full catalog, live cart, orders, and admin controls!

---

## 💻 Part 2: How to Run Locally on Your PC (Windows)

If you want to run the system directly on your local machine:

### 1. Start Local Backend
Open PowerShell in the project root and run:
```powershell
cd e:\adbms\adbms\backend
.\mvnw.cmd spring-boot:run
```
*Backend runs at:* **`http://localhost:8080`**

### 2. Start Local Frontend
Open a second PowerShell window and run:
```powershell
cd e:\adbms\adbms\frontend
npm run dev
```
*Frontend runs at:* **`http://localhost:5173`**

---

## 🌐 Part 3: Hosted Frontend (GitHub Pages)

Your frontend is also deployed as a static site on GitHub Pages:
- **Live URL:** **[https://nimesh-001.github.io/adbms/](https://nimesh-001.github.io/adbms/)**
- Whenever your Cloud Backend (Port `8080`) is running and set to Public, this GitHub Pages site connects to it automatically!

---

> [!TIP]
> **Safety Note:** Never replace `<YOUR_AIVEN_PASSWORD>` in this documentation file with your real password when committing to GitHub. Keeping the placeholder prevents GitHub Secret Scanner from blocking your git pushes.
