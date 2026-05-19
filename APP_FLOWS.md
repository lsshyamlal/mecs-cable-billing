# MECS Cable Billing – Application Flows

## Subscription Status Lifecycle

```
ACTIVE ──[scheduler: start date reached]──► GRACE
GRACE  ──[scheduler: past grace period day]──► PAYMENT_PENDING
PAYMENT_PENDING ──[admin records payment]──► PAID
PAID ──[payment recorded: next month's subscription pre-created immediately]──► ACTIVE
```

## Customer Account Lifecycle

```
ACTIVE ──[admin closes account]──► SUSPENDED
SUSPENDED ──[admin re-enrolls]──► ACTIVE
SUSPENDED ──[2 years elapsed]──► ACCOUNT_CLOSED (portal read-only expires)
```

---

## Authentication

### Login (shared for admin and customer)
1. User enters phone/email + password at `/login`
2. Server validates credentials, sets JWT access token + refresh token (HttpOnly cookie)
3. Redirected by role: `ROLE_ADMIN` → `/admin`, `ROLE_CUSTOMER` → `/portal`

### Session Refresh & Auto-Logout
1. `AuthContext` polls every 60 s; on session expiry or 401, calls `/api/auth/refresh`
2. If refresh fails: clears localStorage, redirects to `/login?expired=1`
3. Expiry warning banner shown before forced logout

---

## Customer Portal

### Portal Home (`/portal`)
1. Fetch customer profile (name, phone, email, STB ID, address, area)
2. Fetch current subscription (period, monthly rate, due date, payment status, grace deadline)
3. Show account/subscription status banners:
   - Orange: payment pending
   - Red: account suspended (with expiry date)
4. Link to subscription history

### Subscription History (`/portal/history`)
1. Query subscriptions from the last 12 months
2. Display table: Month | Period | Rate | Status | Grace Deadline | Paid On

---

## Admin Portal

### Dashboard (`/admin`)
1. Load all customers with subscription data
2. Show count tiles:
   - **Customer Status:** Active, Account Closed
   - **Subscription Status:** Grace (overdue), Payment Pending
3. Each tile links to the filtered Customers list
4. Quick actions: Add Customer · View Pending Payments · Run Billing Scheduler
5. **Run Scheduler** triggers `BillingScheduler.advanceSubscriptionStatuses()` on demand (also runs automatically at 3 AM IST)

---

### Customer Management

#### List & Search (`/admin/customers`)
1. Display all customers: Name, STB ID, Area, Phone, Status, Due Date, Grace Deadline, Rate
2. Filter by: text search (name/phone/STB ID), Status, Area
3. Click row → customer detail page

#### Create Customer (`/admin/customers/new`)
1. Fill form: Personal Details (first/last name, phone, email, UPI ID, STB ID)
2. Address: door, street, Area
3. Subscription: monthly rate, start date (defaults today)
4. Portal Access: optional portal password
5. Server creates `Customer` + initial `Subscription`, emits audit log
6. Redirect to new customer's detail page

#### Customer Detail (`/admin/customers/{id}`)

Displays customer info, current subscription, and payment history.

**Record Payment**
1. Open modal; fields: amount, for-month, payment date, method (Cash/UPI/Bank Transfer/Cheque), notes
2. Server creates `Payment`, sets subscription → PAID, creates next month's subscription, clears `paymentPending`

**Edit Customer**
1. Open modal; editable: name, phone, email, UPI ID, STB ID, address, area
2. Server updates `Customer`, emits audit log

**Close Account**
1. Confirm dialog
2. Server sets customer → SUSPENDED, cancels open subscription, records `suspendedAt`

**Re-enroll Customer** (only if SUSPENDED/ACCOUNT_CLOSED)
1. Open modal; fields: monthly rate, start date
2. Server sets customer → ACTIVE, creates new subscription, clears `suspendedAt`

**Reset Portal Password**
1. Open modal; enter new password (min 6 chars)
2. Server bcrypt-encodes and saves, emits audit log

**Delete Customer**
1. Confirm dialog
2. Server permanently deletes customer + cascade (subscriptions, payments), emits audit log
3. Redirect to customers list

---

### Areas (`/admin/areas`)
1. List all areas: Name, Grace Period Day
2. Add area: name + grace period day (1–28)
3. Grace period day controls when scheduler moves GRACE → PAYMENT_PENDING each month

---

### Reports (`/admin/reports`)

#### Payment Report
1. Set filters: from date, to date, area
2. Run report → table: Date, Customer, Area, Phone, For Month, Amount, Method, Recorded By
3. Shows total revenue
4. Export as CSV or Excel

#### Customer Report
1. Set filters: status, area
2. Run report → table: Name, STB ID, Area, Phone, Status, Due Date, Monthly Rate
3. Shows customer count
4. Export as CSV or Excel

---

### Admin Profile (`/admin/profile`)

**Edit Profile**
1. View: first/last name, email, phone, account created, last login
2. Click Edit → update fields → server updates `Admin` entity

**Change Password**
1. Enter current password, new password, confirm
2. Server validates current password; if correct, updates hash
3. Success message; form clears

---

## Navigation Structure

| Portal | Pages |
|---|---|
| Customer | `/portal` (home), `/portal/history` |
| Admin | `/admin` (dashboard), `/admin/customers`, `/admin/customers/new`, `/admin/customers/{id}`, `/admin/areas`, `/admin/reports`, `/admin/profile` |

---

## Cross-Cutting Concerns

| Concern | Behaviour |
|---|---|
| Audit logging | Every admin write creates an `AuditLog` entry (entity, action, admin, timestamp) |
| Role enforcement | `RequireAdmin` / `RequireCustomer` guards on all protected routes |
| Parameterized queries | All DB access via JPA/JPQL — no string concatenation |
| Timestamps | Stored UTC; displayed IST (Asia/Kolkata) |
| STB ID uniqueness | Partial unique index — unique only among ACTIVE customers |
