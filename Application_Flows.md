# MECS Cable TV Billing Software — Application Flows (Code-Derived)

> **Source of truth:** the actual implementation on branch `feature/dev-work`
> (Spring Boot backend under `src/main/java/com/mecscable/billing/`, React frontend under `frontend/src/`).
> This document was written by reading the code — controllers, services, the scheduler, security
> config, and the React pages/router — **not** the planning docs. Every flow cites the concrete
> endpoint, service method, and/or UI page it comes from.
>
> Where the running code diverges from the original design docs, the code wins; key divergences are
> called out in the final section.

---

## Status models (as implemented in code)

These enums drive most flows, so they're listed first.

**`CustomerStatus`** (`entity/CustomerStatus.java`): `ACTIVE`, `SUSPENDED`, `ACCOUNT_CLOSED`

**`SubscriptionStatus`** (`entity/SubscriptionStatus.java`): `SCHEDULED`, `GRACE`, `PAYMENT_PENDING`, `PAID`, `SUSPENDED`, `CANCELLED`

- A subscription starting **today or earlier** is created in `GRACE` (payment is due on the start date). A **future-dated** subscription is created `SCHEDULED` and goes live via the scheduler. (`CustomerService.createSubscription`)
- "Payment pending" exists at two levels: the subscription's `PAYMENT_PENDING` status **and** a boolean `customer.isPaymentPending` flag, kept in sync by the scheduler and payment flow.
- **Grace deadline is a per-area day-of-month** (`area.gracePeriodDay`), not a fixed 5-day window. For a subscription whose start date falls after that day-of-month, the start date is used instead.

---

## Actors & roles (`config/SecurityConfig.java`)

| Actor | JWT role | Path access |
|---|---|---|
| **Admin** | `ROLE_ADMIN` | `/api/**` (everything except portal) |
| **Customer** | `ROLE_CUSTOMER` | `/api/portal/**` only |
| **System** | — | `BillingScheduler` cron job |

Public endpoints: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/ping`, Swagger. Stateless sessions, CSRF disabled, BCrypt(12), JWT in `HttpOnly`/`SameSite=Strict` cookies (Secure flag configurable).

---

## Flow Index

**A. Authentication & session**
- A1. Login (admin or customer — unified)
- A2. Silent token refresh
- A3. Logout
- A4. Server-restart detection (ping)
- A5. Idle auto-logout (2 h)
- A6. Read-only login for suspended/closed customers

**B. Admin — Customers**
- B1. Add customer (+ initial subscription)
- B2. List / filter customers
- B3. View customer detail
- B4. Edit customer
- B5. Close account
- B6. Re-enroll customer
- B7. Reset portal password
- B8. Delete customer

**C. Admin — Payments**
- C1. Record payment (+ auto-create next month)
- C2. View a customer's payments
- C3. List all payments (date range)
- C4. Monthly collection total

**D. Admin — Areas**
- D1. List areas
- D2. Create area
- D3. Update area

**E. Admin — Subscription Packs**
- E1. List packs
- E2. Create pack
- E3. Update pack

**F. Admin — Dashboard**
- F1. View dashboard (assembled client-side)
- F2. Run billing scheduler manually

**G. Admin — Reports & Export**
- G1. Payment report (+ CSV/Excel export)
- G2. Customer report (+ CSV/Excel export)

**H. Admin — Profile**
- H1. View profile
- H2. Update profile
- H3. Change password

**I. Customer Portal (read-only)**
- I1. View profile + current subscription
- I2. View 12-month subscription history

**J. System / Automated**
- J1. Daily billing scheduler (SCHEDULED→GRACE→PAYMENT_PENDING)

---

## A. Authentication & Session

### A1. Login (unified)
- **UI:** `pages/Login.jsx` → **API:** `POST /api/auth/login` → `AuthController.login` → `AuthService.login`
- **Steps:**
  1. One form takes a **phone-or-email identifier** + password.
  2. Backend looks up an admin by email first; if none, a customer by phone or email (`AuthService.login`).
  3. Admin path: BCrypt check, must be `isActive`, `lastLoginAt` updated. Customer path: BCrypt check against `passwordHash`, status check (see A6).
  4. Issues access token (`ROLE_ADMIN`+adminId, or `ROLE_CUSTOMER`+customerId) and refresh token, both as cookies.
  5. Response (`LoginResponse`) carries role, id, name, email, refresh-expiry, and a **server `instanceId`**.
  6. Frontend stores this in `localStorage` (`mecs_auth`) and routes: `ROLE_CUSTOMER` → `/portal`, else → `/admin`.
- **Note:** there is no separate admin/customer login screen — role is resolved server-side from the identifier.

### A2. Silent token refresh
- **UI:** axios interceptor in `frontend/src/api.js` → **API:** `POST /api/auth/refresh` → `AuthService.refresh`
- **Steps:** On any `401` (except the login call), the interceptor calls `/auth/refresh` once, retries the original request, and queues concurrent requests behind the in-flight refresh. The refresh token cookie is validated and a new access token cookie is minted. On failure → `localStorage` cleared and redirect to `/login?expired=1&user=<name>`.

### A3. Logout
- **UI:** `logout()` in `api.js` → **API:** `POST /api/auth/logout` → `AuthService.logout`
- **Steps:** Both cookies cleared (maxAge 0); frontend `signOut()` clears `localStorage`.

### A4. Server-restart detection
- **UI:** `AuthContext.jsx` on mount → **API:** `GET /api/auth/ping` (returns `instanceId`)
- **Steps:** On every load while authenticated, compares the live `instanceId` to the one stored at login. If different (server restarted) or unreachable, forces sign-out → `/login?restart=1`.

### A5. Idle auto-logout
- **UI:** `AuthContext.jsx`
- **Steps:** Every API response stamps `mecs_last_activity`. A 60 s interval checks for **2 hours** of inactivity; on timeout, signs out → `/login?expired=1`.

### A6. Read-only login for suspended/closed customers
- **Code:** `AuthService.authenticateCustomer`
- **Steps:** A `SUSPENDED` or `ACCOUNT_CLOSED` customer can still authenticate **read-only** if within ~2 years of `suspendedAt`; otherwise login is rejected (`DisabledException`). `PortalHome.jsx` shows a "suspended / read-only until <date>" banner.

---

## B. Admin — Customers (`CustomerController`, `CustomerService`)

### B1. Add customer (+ initial subscription)
- **UI:** `pages/admin/CustomerForm.jsx` (route `/admin/customers/new`) → **API:** `POST /api/customers` → `CustomerService.createCustomer`
- **Steps:**
  1. Form collects personal details, address, **area (select from existing areas)**, optional `subscriptionStartDate` (blank = today), optional `portalPassword` (blank = portal login disabled).
  2. Validates: STB ID not already on an `ACTIVE` customer; phone not already registered to anyone.
  3. Saves customer as `ACTIVE`; if a portal password was given, stores a BCrypt hash.
  4. **Creates an initial subscription** (`createSubscription`): start = given/today, end = last day of that month, status `GRACE` (start ≤ today) or `SCHEDULED` (future). `monthlyRate` starts **null** — the rate is set when the first payment is recorded.
  5. Audit `CREATE_CUSTOMER`. Redirects to the new customer's detail page.
- **Note:** the add-customer form selects an existing area only; new areas are created on the Areas page (D2), not inline.

### B2. List / filter customers
- **UI:** `pages/admin/Customers.jsx` → **API:** `GET /api/customers?status=&futureStatus=&areaId=` → `CustomerService.listCustomers`
- **Steps:** `status` can be a **customer-level** value (`ACTIVE`/`SUSPENDED`/`ACCOUNT_CLOSED`) or a **subscription-level** value (`GRACE`/`PAYMENT_PENDING`/`PAID`/`SUSPENDED`/`CANCELLED`); the latter is computed per-customer from the current subscription and filtered in memory. `futureStatus` filters on next month's subscription status. `areaId` filters by area. Dashboard tiles deep-link into this with query params.

### B3. View customer detail
- **UI:** `pages/admin/CustomerDetail.jsx` (route `/admin/customers/:id`) → **API:** `GET /api/customers/{id}` + `GET /api/payments/{id}`
- **Steps:** Shows customer info, current subscription (period, rate, pack, due date, grace deadline, payment status), and full payment history. Surfaces action buttons (Record Payment, Edit, Close Account / Re-enroll, Reset Password, Delete) gated by status.

### B4. Edit customer
- **UI:** Edit modal in `CustomerDetail.jsx` → **API:** `PUT /api/customers/{id}` → `CustomerService.updateCustomer`
- **Steps:** Partial update of name/address/phone/email/UPI/STB/area. Re-checks phone uniqueness and STB-among-ACTIVE uniqueness (excluding self). Audit `UPDATE_CUSTOMER`.

### B5. Close account
- **UI:** Close-account modal in `CustomerDetail.jsx` → **API:** `PUT /api/customers/{id}/close-account` (body `{paymentCollected}`) → `CustomerService.closeAccount`
- **Steps:**
  1. If the customer has an outstanding `GRACE`/`PAYMENT_PENDING` subscription, the modal asks **"was the payment collected?"**.
  2. `paymentCollected = true` → customer becomes **`ACCOUNT_CLOSED`**; current-period open subscription resolved to `PAID`. `false` → customer becomes **`SUSPENDED`**; open sub resolved to `SUSPENDED`.
  3. Genuinely future-dated subscriptions are `CANCELLED`. `isPaymentPending` cleared, `suspendedAt` set to now (IST).
  4. Audit `CLOSE_ACCOUNT`.
- **Note:** this is the implemented replacement for the design docs' "suspend"; the `ACCOUNT_CLOSED` vs `SUSPENDED` split is driven entirely by whether the final payment was collected.

### B6. Re-enroll customer
- **UI:** Re-enroll modal in `CustomerDetail.jsx` → **API:** `PUT /api/customers/{id}/reenroll` (body `{startDate}`) → `CustomerService.reEnrollCustomer`
- **Steps:** Allowed only if `SUSPENDED` or `ACCOUNT_CLOSED`. Sets customer `ACTIVE`, `isPaymentPending = true`, clears `suspendedAt`, and creates a new subscription **at the customer's existing rate** with status `PAYMENT_PENDING`. Payment is recorded separately afterward. Audit `REENROLL_CUSTOMER`.

### B7. Reset portal password
- **UI:** Reset-password modal in `CustomerDetail.jsx` → **API:** `PUT /api/customers/{id}/reset-password` → `CustomerService.resetPassword`
- **Steps:** Admin sets a new portal password (min 6 chars in UI), stored as BCrypt hash. Audit `RESET_CUSTOMER_PASSWORD`.

### B8. Delete customer
- **UI:** Delete modal in `CustomerDetail.jsx` → **API:** `DELETE /api/customers/{id}` → `CustomerService.deleteCustomer`
- **Steps:** Refuses if customer is `ACTIVE` ("close the account first"). Otherwise **hard-deletes** the customer's payments, subscriptions, then the customer row. Audit `DELETE_CUSTOMER`.

---

## C. Admin — Payments (`PaymentController`, `PaymentService`)

### C1. Record payment (+ auto-create next month)
- **UI:** Record-payment modal in `CustomerDetail.jsx` → **API:** `POST /api/payments/{customerId}` → `PaymentService.recordPayment`
- **Steps:**
  1. Customer must be `ACTIVE` (else rejected). Admin picks a **pack** (prefills amount) or **Manual Override**, a target **month**, payment method (`CASH`/`UPI`/`BANK_TRANSFER`/`CHEQUE`), and notes. Payment date is **now in IST** (not editable).
  2. Finds the payable subscription for that month (status in `SCHEDULED`/`GRACE`/`PAYMENT_PENDING`); errors if none.
  3. Saves a `Payment` (amount, IST timestamp, method, recordedBy, notes, pack, `manualOverride` flag); marks that subscription `PAID` and attaches the pack.
  4. **Auto-creates the next month's subscription** as `SCHEDULED` (at this amount/pack) if one doesn't already exist.
  5. Updates customer `lastPayment*`/`currentPaymentAmount`, clears `isPaymentPending`.
  6. Audit `RECORD_PAYMENT`.

### C2. View a customer's payments
- **API:** `GET /api/payments/{customerId}` → `PaymentService.listByCustomer` (shown in the detail page history table).

### C3. List all payments (date range)
- **API:** `GET /api/payments?from=&to=` → `PaymentService.listAll` (IST day boundaries when both dates supplied; else all).

### C4. Monthly collection total
- **API:** `GET /api/payments/summary?month=yyyy-MM` → `PaymentService.monthTotal` (sum of payments in that IST month; used by the dashboard's "Payments Collected" tiles).

---

## D. Admin — Areas (`AreaController`, `AreaService`)

- **D1. List areas** — `GET /api/areas` (sorted by name; returns `gracePeriodDay`). Used by customer/report/area dropdowns.
- **D2. Create area** — `POST /api/areas` (`{areaName, gracePeriodDay}`); name unique case-insensitive. UI: `pages/admin/Areas.jsx`.
- **D3. Update area** — `PUT /api/areas/{id}`; rename + change `gracePeriodDay` (which directly affects grace deadlines in flows J1, I1).

---

## E. Admin — Subscription Packs (`SubscriptionPackController`, `SubscriptionPackService`)

> Packs are a named rate catalogue (`packName`, `monthlyRate`, `description`) used to prefill payment amounts.

- **E1. List packs** — `GET /api/subscription-packs` (sorted by name).
- **E2. Create pack** — `POST /api/subscription-packs`; name unique case-insensitive. UI: `pages/admin/SubscriptionPacks.jsx`.
- **E3. Update pack** — `PUT /api/subscription-packs/{id}`.

---

## F. Admin — Dashboard (`pages/admin/Dashboard.jsx`)

### F1. View dashboard
- **No dedicated endpoint** — the page assembles its own view from `GET /api/customers` + two `GET /api/payments/summary` calls (this month, last month).
- **Tiles:**
  - **Customer Status:** ACTIVE / SUSPENDED / ACCOUNT_CLOSED counts.
  - **Current Subscription Status:** PAYMENT_PENDING / PAID / GRACE / SUSPENDED counts.
  - **Future Subscription Status:** "Next Month Ready" (ACTIVE) / CANCELLED counts.
  - **Payments Collected:** this-month and last-month totals (link to Reports).
- Each status tile deep-links to the filtered customer list (B2).

### F2. Run billing scheduler manually
- **UI:** "Run Billing Scheduler" quick action → **API:** `POST /api/admin/scheduler/run` → `BillingScheduler.advanceSubscriptionStatuses` (same logic as the cron job J1). Returns counts moved to GRACE / PAYMENT_PENDING and shows them inline.

---

## G. Admin — Reports & Export (`ReportController`, `ReportService`)

### G1. Payment report
- **UI:** Payments tab in `pages/admin/Reports.jsx` → **API:** `GET /api/reports/payments?from=&to=&areaId=`
- **Export:** `GET /api/reports/payments/export?...&format=csv|excel` streams a `payments_report.csv` / `.xlsx` download.

### G2. Customer report
- **UI:** Customers tab in `Reports.jsx` → **API:** `GET /api/reports/customers?status=&areaId=`
- **Export:** `GET /api/reports/customers/export?...&format=csv|excel`.
- **Note:** there is **no separate "pending payments" report endpoint** — running the customer report with `status=PAYMENT_PENDING` (or `GRACE`) covers that case.

---

## H. Admin — Profile (`AdminController`, `AdminService`)

- **H1. View profile** — `GET /api/admin/me`.
- **H2. Update profile** — `PUT /api/admin/me` (name/phone/email). UI: `pages/admin/AdminProfile.jsx`.
- **H3. Change password** — `PUT /api/admin/me/password` (requires current-password confirmation).

---

## I. Customer Portal — read-only (`PortalController`, `PortalService`)

> All endpoints scope to the authenticated customer's own `customerId` from the JWT. UPI ID and payment method are **not** returned. Routes guarded by `RequireCustomer` (`App.jsx`).

### I1. View profile + current subscription
- **UI:** `pages/PortalHome.jsx` (route `/portal`) → **API:** `GET /api/portal/me` + `GET /api/portal/me/subscription/current`
- **Steps:** Shows profile (name, address, area, phone, email, STB ID, status, member-since) and the current subscription (period, rate, due date, resolved status, grace deadline, payment-pending banner). Suspended customers see a read-only-until-date banner.

### I2. View 12-month subscription history
- **UI:** `pages/PortalHistory.jsx` (route `/portal/history`) → **API:** `GET /api/portal/me/subscription/history`
- **Steps:** Lists subscriptions started in the last 12 months — period, rate, status, latest payment date, grace deadline.

---

## J. System / Automated (`scheduler/BillingScheduler.java`)

### J1. Daily billing scheduler
- **Trigger:** `@Scheduled(cron = "0 0 3 * * *", zone = "Asia/Kolkata")` — **3:00 AM IST daily** (also runnable on demand via F2).
- **Step 1 — SCHEDULED → GRACE** (`moveActiveToGrace`): every `SCHEDULED` subscription whose `startDate ≤ today` (skipping `ACCOUNT_CLOSED` customers) becomes `GRACE`, and the customer's "current subscription" pointer/amount/due-date advance to it (so the UI shows the new period rather than last month's PAID one).
- **Step 2 — GRACE → PAYMENT_PENDING** (`moveGraceToPaymentPending`): for each `GRACE` subscription (skipping `ACCOUNT_CLOSED`), the grace deadline = the customer's **area `gracePeriodDay`** within the subscription's start month (or the start date if that day already passed). If `today` is past the deadline, the subscription becomes `PAYMENT_PENDING` and `customer.isPaymentPending = true`. Audit `PAYMENT_PENDING` (system actor).
- Returns `{graceCount, pendingCount}`.

---

## Cross-cutting behaviors (in code)

- **Audit logging:** writes go through `AuditService` (`CREATE_CUSTOMER`, `UPDATE_CUSTOMER`, `CLOSE_ACCOUNT`, `REENROLL_CUSTOMER`, `RESET_CUSTOMER_PASSWORD`, `DELETE_CUSTOMER`, `RECORD_PAYMENT`, and system `PAYMENT_PENDING`).
- **Timezone:** all "now"/date logic uses `Asia/Kolkata` explicitly (`ZoneId.of("Asia/Kolkata")`) in services and scheduler.
- **Validation:** request DTOs use `@Valid`; `GlobalExceptionHandler` shapes errors; uniqueness checks for phone, STB-among-ACTIVE, area name, pack name.
- **CORS:** dynamic per-request — allows the configured origin plus any same-host origin (handles Cloudflare Tunnel) — `SecurityConfig.corsConfigurationSource`.

---

## How the code diverges from the original planning docs

These are real differences found in the implementation (the docs describe the older design):

1. **"Suspend" is now "Close Account"** with a `paymentCollected` branch → `ACCOUNT_CLOSED` (paid) vs `SUSPENDED` (unpaid). There is no `PUT /customers/{id}/suspend` endpoint.
2. **Customer statuses** are `ACTIVE / SUSPENDED / ACCOUNT_CLOSED` (docs: only ACTIVE/SUSPENDED).
3. **Subscription statuses** include `SCHEDULED` (migration `V12` renamed the old `ACTIVE` → `SCHEDULED`); full set is `SCHEDULED/GRACE/PAYMENT_PENDING/PAID/SUSPENDED/CANCELLED`.
4. **Grace period is a per-area day-of-month** (`area.gracePeriodDay`), not a fixed 5-day window.
5. **Subscription Packs** (named rate catalogue) exist and prefill payments; the per-customer `monthlyRate` is **null until the first payment** sets it.
6. **Next month's subscription is auto-created (`SCHEDULED`) on payment** — a pre-creation step the docs' "no auto-renewal" rule didn't describe.
7. **No `/subscriptions` controller and no `/dashboard/summary` endpoint** — enrollment happens inside customer create/re-enroll/payment, and the dashboard is assembled client-side.
8. **Reports** expose payment + customer reports (with CSV/Excel export); there is **no separate pending-payments export** — it's a filter on the customer report.
9. **Extra session flows not in the docs:** unified phone-or-email login, silent refresh interceptor, server-restart detection via `/auth/ping`, 2-hour idle logout, and 2-year read-only portal access for suspended/closed customers.

---

*Derived from the implementation on branch `feature/dev-work`. Re-verify against code after future changes.*
