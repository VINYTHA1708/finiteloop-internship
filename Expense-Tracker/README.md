# Expense Tracker – Personal Finance Management System

An elegant, secure, and feature-rich full-stack web application designed to help individuals track their daily expenses, configure category budgets, analyze spending trends, and generate comprehensive reports.

---

## 🚀 Key Features

* **Lightweight Custom Authentication**: Secure session control utilizing custom UUID tokens and robust `jbcrypt` hashing. Intercepts endpoints to guarantee authorized access.
* **Personal Finance Dashboard**: Premium dark-mode-first glassmorphic layouts displaying key cashflow metrics (Total Spent, Active Categories, Count, Remaining Budget) alongside live statistics using **Chart.js** (Monthly spending trend, category allocations, payment method comparisons).
* **Robust CRUD Ledger**: A fully paginated, searchable, and column-sortable ledger for recording daily transactions.
* **Proactive Budget Control**: Category cards indicating monthly budget thresholds via dynamic indicators that shift from safe green to warning amber and a pulsing alert red when thresholds are breached. Exceeding transactions prompt warning toasts.
* **Comprehensive Financial Reports**: Advanced filters (date boundaries, payment types, category classifications) with on-the-fly summary statistics (Total, Mean Average, Highest transaction) and download tools for secured **CSV spreadsheet tables** and **formatted OpenPDF reports**.

---

## 🛠️ Technology Stack

* **Frontend**: Vanilla HTML5, CSS3 Custom Theme Systems (Light & Dark Mode support), JavaScript (Modular Vanilla JS), Chart.js (Data Visualization).
* **Backend**: Java 21, Spring Boot 3.2.x, Hibernate (JPA), REST Web APIs.
* **Database**: MySQL / MariaDB.
* **PDF Exporter Engine**: OpenPDF.

---

## 📁 Repository Folder Structure

```
c:\Users\vinyt\Downloads\Finiteloop-Internship\Application\
├── pom.xml                                   # Maven dependencies & Build plugins
├── database_setup.sql                        # Schema script & sandbox starter seeds
├── README.md                                 # Project documentation
├── frontend/                                 # Static web app resources
│   ├── index.html                            # Root gateway routing
│   ├── css/
│   │   ├── style.css                         # Shared design system, alerts, light/dark themes
│   │   └── dashboard.css                     # Sidebar, grids, card, modal dialog layouts
│   ├── js/
│   │   ├── auth.js                           # Auth validations, dynamic API fallback, toast methods
│   │   ├── dashboard.js                      # Analytics summaries, Chart.js, recent table
│   │   ├── expense.js                        # Transactions & Category budget manager
│   │   └── report.js                         # Summary calculators, filtered tables, file downloads
│   └── pages/
│       ├── login.html                        # Sandbox sign-in
│       ├── register.html                     # Sandbox sign-up
│       ├── dashboard.html                    # Analytics core
│       ├── expenses.html                     # Transaction ledger
│       ├── categories.html                   # Budget thresholds configuration
│       └── reports.html                      # Exporters and filter engines
└── src/                                      # Java Spring Boot source code
    ├── main/
    │   ├── java/com/finiteloop/expensetracker/
    │   │   ├── ExpenseTrackerApplication.java # Launcher class
    │   │   ├── config/                       # CORS Config, Static resources, Interceptors Binds
    │   │   ├── controller/                   # Auth, Category, Expense, Report REST Endpoints
    │   │   ├── dto/                          # Flat request / response data structures
    │   │   ├── exception/                    # Custom anomalies, JSON Global Exception Handler
    │   │   ├── model/                        # Users, Categories, Expenses Hibernate Entities
    │   │   ├── repository/                   # JpaRepository Interfaces
    │   │   └── service/                      # Services with BCrypt & budget thresholds checks
    │   └── resources/
    │       └── application.properties        # DB connectivity, JPA, and server parameters
    └── test/                                 # Unit & Mockito Mock testing suites
```

---

## 💾 Database Design

The database schema, defined in `database_setup.sql` and managed automatically by Hibernate JPA, maintains the following relational structure:

* **Users Table**: `user_id` (PK, Auto-increment), `name`, `email` (Unique), `password` (Hashed).
* **Categories Table**: `category_id` (PK, Auto-increment), `category_name` (Unique), `budget_limit` (Double).
* **Expenses Table**: `expense_id` (PK, Auto-increment), `amount` (Double), `description` (Varchar), `date` (Date), `payment_method` (Varchar), `created_at` (Datetime), `user_id` (FK), `category_id` (FK).

### Relationships:
* `User` **OneToMany** ➔ `Expenses` (Deleting a user cascades and wipes their expenses).
* `Category` **OneToMany** ➔ `Expenses` (Deleting a category wipes associated expenses).
* `Expense` **ManyToOne** ➔ `User` & `Category` (Binds every transaction).

---

## 🔧 Installation & Local Setup

Follow these steps to run the application locally on Windows:

### 1. Database Configuration
Ensure XAMPP MySQL is active. Create the database and seed it by executing:
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS expense_tracker;"
mysql -u root expense_tracker < database_setup.sql
```
*Credentials: Sandbox user is automatically created with email `sandbox@finiteloop.com` and password `password123`.*

### 2. Configure Backend Credentials
Verify connection attributes inside `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
```

### 3. Build & Run Application
From the workspace root directory, build and launch the Spring Boot server:
```bash
mvn clean package
mvn spring-boot:run
```
The application will boot successfully on port `8080`!

### 4. Open in Browser
Because Spring Boot serves the local directory directly, navigate to:
👉 **`http://localhost:8080/index.html`**

*Developer Sandbox Option*: You can also run the backend on port `8080` and open the HTML files directly from disk (e.g. double-click `frontend/index.html` on Windows). The JS dynamic resolution logic will handle fetches by pointing calls directly to `http://localhost:8080/api/` automatically.

---

## 🔌 REST API Specifications

All API payloads use standard JSON and authorize resources using the custom header `Authorization: Bearer <token>`.

### Authentication:
* `POST /api/auth/register` (Registers a new account, hashes password, auto-logs user in).
* `POST /api/auth/login` (Authenticates user password, registers a secure UUID token session, returns details).
* `POST /api/auth/logout` (Destroys the token mapping on the server).

### Category Management:
* `GET /api/categories` (Lists all active categories).
* `POST /api/categories` (Adds a custom category and establishes a budget limit).
* `PUT /api/categories/{id}` (Modifies name or budget limits).
* `DELETE /api/categories/{id}` (Wipes category and dependent logs).

### Expense Ledger:
* `GET /api/expenses` (Returns filtered, searched, paginated, and sorted page payload).
  * *Params*: `page`, `size`, `sortBy`, `sortDir`, `categoryId`, `paymentMethod`, `startDate`, `endDate`, `search`
* `POST /api/expenses` (Creates an expense and runs budget breach checks).
* `PUT /api/expenses/{id}` (Modifies amount, date, description, payment method, or category).
* `DELETE /api/expenses/{id}` (Wipes expense).

### Report Metrics & Exporters:
* `GET /api/reports/summary` (Returns full analytics payload for rendering dashboard cards and Chart.js).
* `GET /api/reports/filter` (Filters records over criteria).
* `GET /api/reports/export/csv` (Generates dynamically streamed CSV table files).
* `GET /api/reports/export/pdf` (Generates styled A4 PDF document containing statistics).

---

## ☁️ Deployment Instructions

### Frontend (Netlify):
1. Create a `_redirects` file in the build path mapping wildcard endpoints to backend endpoints if running cross-origin, or host the `frontend/` folder directly.
2. Define environment variables in Netlify pointing API calls to your hosted Render backend server.

### Backend (Render):
1. Create a new **Web Service** on Render.
2. Select Java Environment and set compilation variables to `mvn clean package -DskipTests`.
3. Set execution start command to `java -jar target/expense-tracker-1.0.0.jar`.
4. Configure database variables to point to your hosted MySQL database service (e.g., Aiven, Clever Cloud, or Render PostgreSQL with custom configurations).
