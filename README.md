# Credit Management Web Application

A professional, full-stack, production-ready Credit Management Web Application. It provides customer account tracking, daily credit/debit transaction logs, opening/closing balance ledger generation, dynamic visual dashboards, and comprehensive reporting with Excel/PDF export capabilities.

---

## Technical Architecture

The project is structured as a decoupled full-stack application:

*   **Frontend**: Next.js 14/16 (App Router) styled with Tailwind CSS v4 and polished UI assets, charting via Recharts, and client-side reporting using `jsPDF` and `xlsx`.
*   **Backend**: Node.js & Express.js REST API with database interaction modeled via Mongoose.
*   **Database**: MongoDB Atlas cloud cluster.
*   **Auth**: Secure JWT (JSON Web Tokens) with hashed credentials (bcryptjs).

---

## Directory Structure

```
Credit Management/
├── client/                    # Next.js Frontend App
│   ├── app/                   # App Router Pages & Styles
│   ├── components/            # Layout and Shadcn UI components
│   ├── context/               # Auth Context Provider
│   ├── hooks/                 # Toast hooks
│   └── lib/                   # Axios API configuration & utility helpers
│
└── server/                    # Express.js REST API Backend
    ├── src/
    │   ├── config/            # DB configuration
    │   ├── middleware/        # Authorization & error guards
    │   ├── models/            # Mongoose Schemas (User, Customer, CreditEntry, etc.)
    │   ├── routes/            # API Router endpoints
    │   └── server.js          # Server setup & route registry
    ├── seed.js                # Administrator accounts seeder
    └── .env                   # Local server environment configuration
```

---

## Installation & Setup

### Prerequisites

*   Node.js (v18+)
*   NPM / Yarn

### 1. Backend Server Setup

1.  Navigate to the `server/` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables in `server/.env`:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your_jwt_signature_key
    JWT_EXPIRES_IN=7d
    FRONTEND_URL=http://localhost:3000
    NODE_ENV=development
    ```
4.  Run the database seeder to create the default **System Administrator** account:
    ```bash
    npm run seed
    ```
    *   **Username**: `admin`
    *   **Password**: `Admin@123`
    *   *(Note: Remember to update this password inside user settings upon your first login)*
5.  Start the backend server in development mode:
    ```bash
    npm run dev
    ```

### 2. Frontend Client Setup

1.  Navigate to the `client/` directory:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your client environment variable inside `client/.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Role-Based Access Control Matrix

The system enforces three level role guards:

| Feature / Page | Administrator (`admin`) | Operator (`operator`) | Viewer (`viewer`) |
| :--- | :---: | :---: | :---: |
| View Dashboard Stats & Trends | ✅ | ✅ | ✅ |
| Customer Directory (Read) | ✅ | ✅ | ✅ |
| Customer Management (Create/Update/Delete) | ✅ | ✅ | ❌ |
| Record Credit Entries (Credit/Debit) | ✅ | ✅ | ❌ |
| Delete Credit Entries | ✅ | ❌ | ❌ |
| Set Opening Balances | ✅ | ✅ | ❌ |
| Update Opening Balances | ✅ | ❌ | ❌ |
| Calculate Closing Balances | ✅ | ✅ | ❌ |
| Export Transactions & Reports | ✅ | ✅ | ✅ |
| User Directory Control | ✅ | ❌ | ❌ |
| System Audit Trail / Activity Logs | ✅ | ❌ | ❌ |
| Account Details & Theme Settings | ✅ | ✅ | ✅ |

---

## API Endpoints

### Auth Endpoint
*   `POST /api/auth/login` - User sign-in
*   `GET /api/auth/me` - Fetch active user profile session
*   `PUT /api/auth/change-password` - Update account password

### Customer Directory
*   `GET /api/customers` - Paginated customer listings with filtering
*   `POST /api/customers` - Add new customer profile
*   `GET /api/customers/:id` - Fetch single customer details
*   `PUT /api/customers/:id` - Edit customer details
*   `DELETE /api/customers/:id` - Remove customer profile
*   `GET /api/customers/:id/history` - Retrieve customer statement ledger history

### Transaction & Entries
*   `GET /api/credit-entries` - Filtered daily transactions log list
*   `POST /api/credit-entries` - Create transaction entry (Credits & Debits)
*   `PUT /api/credit-entries/:id` - Modify transaction details
*   `DELETE /api/credit-entries/:id` - Soft-delete transaction entry & revert balances

### Opening & Closing Balances
*   `GET /api/opening-balance` - Retrieve opening balance adjustments list
*   `POST /api/opening-balance` - Set customer opening balance value
*   `GET /api/closing-balance` - Retrieve calculated closing records
*   `POST /api/closing-balance/calculate` - Run calculation and record daily closing ledger

### Reporting Suite
*   `GET /api/reports/credit-summary` - Realtime balance directory summary
*   `GET /api/reports/outstanding` - Active customers list with outstanding balances
*   `GET /api/reports/date-wise` - Transaction listings by date range
*   `GET /api/reports/monthly` - Monthly aggregated statistics log
*   `GET /api/reports/ledger/:customerId` - Individual rolling ledger statements
*   `GET /api/reports/opening-balances` - Opening balances listing report
*   `GET /api/reports/closing-balances` - Closing balances listing report
*   `GET /api/reports/daily-collection` - Summary collections and debits

### Administration control
*   `GET /api/users` - View system user profiles
*   `POST /api/users` - Create user logins
*   `PUT /api/users/:id` - Update user logins
*   `DELETE /api/users/:id` - Delete user logins
*   `GET /api/activity-logs` - View activity logs trail
