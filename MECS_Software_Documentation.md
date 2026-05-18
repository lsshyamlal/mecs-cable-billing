# MECS Cable TV Billing Software — Comprehensive Documentation

> **Document Version:** 1.3  
> **Created:** April 19, 2026  
> **Last Updated:** April 19, 2026  
> **Status:** Living Document — update as requirements evolve  
> **Scope:** MVP (Admin full access; Customer read-only portal for own data)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Entity & Data Model](#4-entity--data-model)
5. [Business Rules](#5-business-rules)
6. [API Design Outline](#6-api-design-outline)
7. [Security Considerations](#7-security-considerations)
8. [Deployment Guide Outline](#8-deployment-guide-outline)
9. [Future Scope](#9-future-scope)
10. [Open Questions & Decisions Log](#10-open-questions--decisions-log)

---

## 1. Executive Summary

**MECS** (**Madura Education and Communication Systems**) is a cable TV business operating in Madurai, Tamil Nadu, India. This document describes the **MECS Cable TV Billing Software** — a web-based billing and customer management system built specifically for the MECS business.

### Purpose
To replace manual/paper-based billing with a reliable, secure, and low-cost digital system that the MECS business owner (admin) can operate from anywhere in the world, hosted on a dedicated laptop at the business premises.

### Key Constraints
| Constraint | Decision |
|---|---|
| Cost | Zero to minimal recurring expense — all open-source stack, self-hosted |
| Timezone | All business logic and display in **IST (Asia/Kolkata, UTC+5:30)** |
| Hosting | Owner's laptop as the server (running 24/7) |
| Access | Accessible globally via **Cloudflare Tunnel** (free) — no open inbound ports, no static IP required |
| Security | HTTPS via Cloudflare, JWT authentication, BCrypt password hashing, firewall |
| Maintainability | Simple enough for a CS college student to maintain |
| Scalability | Architecture open to new features with minimal structural changes |

### MVP Scope
- **Admin:** Full access — login, manage all customers (add/update/delete/suspend/re-enroll), record payments, manage subscriptions, view dashboard, export reports
- **Customer:** Read-only portal — login and view their own personal details, current subscription status, and past 12 months of subscription history (month-by-month)
- Dynamic area management (admin only)
- Payment pending tracking with dashboard alert (admin only)
- Data export in CSV / Excel (admin only)

> **Access Rule:** Only the admin can create, update, or delete any customer record. Customers have **view-only** access to their own data. Customers cannot see other customers' data.

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                               │
│                                                                 │
│   Admin Browser / Any Browser (HTTPS)                           │
│   URL: https://mecs-billing.yourdomain.com                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE EDGE (Free)                          │
│                                                                  │
│  • SSL/TLS termination (Cloudflare-managed certificate)          │
│  • DDoS protection                                               │
│  • Zero Trust access layer (optional future hardening)           │
│  • Routes traffic through Cloudflare Tunnel                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Encrypted outbound tunnel (cloudflared)
                           │ NO open inbound ports on the laptop
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    OWNER'S LAPTOP (Server)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │         cloudflared (Cloudflare Tunnel daemon)            │    │
│  │   Outbound-only encrypted connection to Cloudflare edge   │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │ forwards to localhost:8080            │
│  ┌────────────────────────▼────────────────────────────────┐     │
│  │             Spring Boot Application (Java 17)            │     │
│  │                                                          │     │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │     │
│  │   │  REST    │  │ Spring   │  │  Business Service    │  │     │
│  │   │  API     │  │ Security │  │  Layer               │  │     │
│  │   │  Layer   │  │  + JWT   │  │  (Billing Logic)     │  │     │
│  │   └────┬─────┘  └──────────┘  └──────────────────────┘  │     │
│  │        │                                                  │     │
│  │   ┌────▼─────────────────────────────────────────────┐   │     │
│  │   │         Spring Data JPA / Hibernate               │   │     │
│  │   └────────────────────┬─────────────────────────────┘   │     │
│  └───────────────────────┬┴────────────────────────────────┘     │
│                          │                                        │
│  ┌───────────────────────▼────────────────────────────────┐      │
│  │              PostgreSQL Database                         │      │
│  │         (TimeZone = UTC internally)                      │      │
│  └───────────────────────┬────────────────────────────────┘      │
│                          │                                        │
│  ┌───────────────────────▼────────────────────────────────┐      │
│  │    Daily Backup: pg_dump → /backups/ (3:00 AM IST)      │      │
│  │    Optional: rclone sync → Google Drive (off-site)       │      │
│  └────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### Why Cloudflare Tunnel vs. Port-Forwarding / DuckDNS

| Aspect | Port-Forwarding + DuckDNS | Cloudflare Tunnel ✅ |
|---|---|---|
| Open inbound ports on laptop | Yes (80, 443) — attack surface | **None** — outbound only |
| Static/stable IP required | No (DuckDNS workaround) | **No** — tunnel handles it |
| SSL certificate management | Manual (Certbot + renewal) | **Automatic** via Cloudflare |
| DDoS protection | None | **Built-in** at Cloudflare edge |
| Cost | Free | **Free** |
| Nginx needed | Yes | **No** — cloudflared routes directly to Spring Boot |
| Home router config | Port-forwarding rules required | **Nothing** — no router changes |
| Works behind CGNAT / ISP restrictions | Sometimes fails | **Always works** |

### Frontend Architecture
- **React.js** single-page application (SPA)
- Communicates with backend via REST API (JSON over HTTPS)
- JWT token stored in `HttpOnly` cookies (not `localStorage`)
- Responsive design for desktop and tablet use

### Backend Architecture
- **Spring Boot 3.x** application
- Three-tier: Controller → Service → Repository (JPA)
- `systemd` service ensures auto-start and restart on crash
- All timestamps stored in **UTC** in DB; converted to **IST** at the API/UI layer

---

## 3. Technology Stack

| Layer | Technology | Version | Cost | Rationale |
|---|---|---|---|---|
| **Frontend** | React.js | 18.x | Free | Future-proof, reusable for mobile app via React Native |
| **UI Library** | Tailwind CSS or Bootstrap | Latest | Free | Clean, simple, responsive UI |
| **Backend** | Java + Spring Boot | 17 LTS / 3.x | Free | Robust, industry-standard, easy to maintain |
| **Security** | Spring Security + JWT | Bundled | Free | Industry-standard auth/authz |
| **ORM** | Spring Data JPA + Hibernate | Bundled | Free | Eliminates boilerplate DB code |
| **Database** | PostgreSQL | 14+ | Free | Open-source, reliable, production-grade |
| **Global Access** | **Cloudflare Tunnel** (`cloudflared`) | Latest | **Free** | Secure outbound-only tunnel; no open ports, no static IP, SSL included |
| **SSL Certificate** | Cloudflare-managed (auto) | — | **Free** | Automatic, no Certbot or renewal needed |
| **DNS** | Cloudflare DNS | — | **Free** | Manage your domain's DNS via Cloudflare (e.g., `mecs-billing.yourdomain.com`) |
| **Process Manager** | systemd (Linux) | OS bundled | Free | Auto-restart, boot startup for both Spring Boot and cloudflared |
| **DB Backup** | pg_dump + cron | OS bundled | Free | Automated daily snapshots |
| **Off-site Backup** | rclone + Google Drive | Free tier | Free | 15 GB free off-site redundancy |
| **Build Tool** | Maven | 3.x | Free | Standard Java build tool |
| **API Docs** | springdoc-openapi (Swagger UI) | Latest | Free | Auto-generated interactive API docs |
| **OS (Server)** | Ubuntu LTS (recommended) | 22.04 LTS | Free | Stable, widely supported, good systemd support |

> **Note:** Nginx is **not required** with Cloudflare Tunnel. The `cloudflared` daemon routes HTTPS traffic directly from Cloudflare's edge to your Spring Boot app on `localhost:8080`. This removes one layer of complexity.

---

## 4. Entity & Data Model

### 4.1 Entity Relationship Summary

```
admins ──────────────────────────────────────────┐
                                                  │ recorded_by
areas ────────────────┐                           │
                      │ area_id (FK)              ▼
                      ▼                        payments
customers ──────────────────────────────────────────
    │                                          ▲
    │ customer_id (FK)                         │
    ▼                                          │
subscriptions ─────────────────────────────────┘
                                          subscription_id (FK)

audit_logs ← references any entity (polymorphic log)
```

---

### 4.2 Table: `admins`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `admin_id` | `BIGSERIAL` | PRIMARY KEY | Unique admin identifier |
| `first_name` | `VARCHAR(100)` | NOT NULL | Admin's first name |
| `last_name` | `VARCHAR(100)` | — | Admin's last name |
| `email` | `VARCHAR(255)` | UNIQUE NOT NULL | Login email |
| `phone` | `VARCHAR(20)` | — | Contact number |
| `password_hash` | `VARCHAR(255)` | NOT NULL | BCrypt hashed password |
| `is_active` | `BOOLEAN` | NOT NULL DEFAULT TRUE | Soft-disable admin account |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Account creation timestamp (stored UTC) |
| `last_login_at` | `TIMESTAMPTZ` | — | Last successful login timestamp |

---

### 4.3 Table: `areas`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `area_id` | `BIGSERIAL` | PRIMARY KEY | Unique area identifier |
| `area_name` | `VARCHAR(200)` | UNIQUE NOT NULL | Area name (e.g., "Panthadi Area", "Navabathkhana Street") |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | When this area was first added |

> **Note:** Areas are dynamically added by the admin. No predefined list. The dropdown in the UI is populated from this table and always includes an "Add New Area..." option.

---

### 4.4 Table: `customers`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `customer_id` | `BIGSERIAL` | PRIMARY KEY | Unique customer identifier |
| `first_name` | `VARCHAR(100)` | NOT NULL | Customer's first name |
| `last_name` | `VARCHAR(100)` | — | Customer's last name |
| `door_number` | `VARCHAR(50)` | — | Door/house number |
| `street_name` | `VARCHAR(200)` | — | Street name |
| `area_id` | `BIGINT` | FK → areas(area_id) NOT NULL | Area reference |
| `phone` | `VARCHAR(20)` | NOT NULL | Primary contact number |
| `email` | `VARCHAR(255)` | — | Email address (optional) |
| `upi_id` | `VARCHAR(100)` | — | UPI ID for payment reference (admin uses this to send payment requests manually) |
| `stb_id` | `VARCHAR(100)` | — | Set-top Box ID (can be reassigned after suspension; see business rules) |
| `account_created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | When this customer was first added |
| `status` | `ENUM` | NOT NULL DEFAULT 'ACTIVE' | Values: `ACTIVE`, `SUSPENDED` |
| `last_payment_amount` | `DECIMAL(10,2)` | — | Amount of the last recorded payment |
| `last_payment_date` | `DATE` | — | Date of the last recorded payment |
| `current_payment_amount` | `DECIMAL(10,2)` | — | Current month's subscription amount due |
| `current_payment_date` | `DATE` | — | Date current payment was received (null if pending) |
| `current_payment_due_date` | `DATE` | — | Due date for current subscription payment |
| `is_payment_pending` | `BOOLEAN` | NOT NULL DEFAULT FALSE | True if grace period has passed with no payment |
| `current_subscription_start` | `DATE` | — | Start date of current/active subscription |
| `current_subscription_end` | `DATE` | — | End date of current/active subscription |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Last modified timestamp |

> **STB ID Uniqueness:** A partial unique index enforces STB ID uniqueness only among `ACTIVE` customers:  
> `CREATE UNIQUE INDEX uq_stb_active ON customers(stb_id) WHERE status = 'ACTIVE' AND stb_id IS NOT NULL;`

---

### 4.5 Table: `subscriptions`

Stores the full history of every subscription enrollment for every customer.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `subscription_id` | `BIGSERIAL` | PRIMARY KEY | Unique subscription record |
| `customer_id` | `BIGINT` | FK → customers(customer_id) NOT NULL | Which customer |
| `monthly_rate` | `DECIMAL(10,2)` | NOT NULL | Rate agreed at enrollment (set by admin) |
| `start_date` | `DATE` | NOT NULL | Subscription start date |
| `end_date` | `DATE` | NOT NULL | Subscription end date (always last day of a month) |
| `status` | `ENUM` | NOT NULL | Values: `ACTIVE`, `GRACE`, `PAYMENT_PENDING`, `PAID`, `SUSPENDED`, `CANCELLED` |
| `enrolled_by` | `BIGINT` | FK → admins(admin_id) | Admin who created this subscription |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | When enrollment was recorded |
| `notes` | `TEXT` | — | Optional admin notes |

---

### 4.6 Table: `payments`

Records each payment transaction against a subscription.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `payment_id` | `BIGSERIAL` | PRIMARY KEY | Unique payment record |
| `customer_id` | `BIGINT` | FK → customers(customer_id) NOT NULL | Which customer paid |
| `subscription_id` | `BIGINT` | FK → subscriptions(subscription_id) | Which subscription this payment is for |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Amount paid |
| `payment_date` | `DATE` | NOT NULL | Date payment was received (as recorded by admin) |
| `payment_method` | `VARCHAR(50)` | — | e.g., "Cash", "UPI", "Bank Transfer" |
| `recorded_by` | `BIGINT` | FK → admins(admin_id) NOT NULL | Admin who recorded the payment |
| `notes` | `TEXT` | — | Optional payment notes |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | When this record was created |

---

### 4.7 Table: `audit_logs`

Tracks all write operations for accountability and debugging.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `log_id` | `BIGSERIAL` | PRIMARY KEY | Unique log entry |
| `actor_id` | `BIGINT` | NOT NULL | admin_id of who performed the action |
| `actor_role` | `VARCHAR(50)` | NOT NULL | e.g., "ADMIN" |
| `action` | `VARCHAR(100)` | NOT NULL | e.g., "CREATE_CUSTOMER", "RECORD_PAYMENT", "SUSPEND_CUSTOMER" |
| `entity_type` | `VARCHAR(100)` | NOT NULL | e.g., "Customer", "Subscription", "Payment" |
| `entity_id` | `BIGINT` | — | ID of the affected entity |
| `details` | `JSONB` | — | Before/after values or relevant context |
| `timestamp` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | When the action occurred (stored UTC) |
| `ip_address` | `VARCHAR(50)` | — | IP address of the request |

---

## 5. Business Rules

All rules are numbered for traceability. Reference these when implementing logic.

### 5.1 Timezone Rules
- **BR-TZ-01:** All timestamps are stored in the database as **UTC**.
- **BR-TZ-02:** All timestamps displayed in the UI are converted to **IST (Asia/Kolkata, UTC+5:30)**.
- **BR-TZ-03:** The JVM timezone is set to UTC (`-Duser.timezone=UTC`). IST conversion is done at the application/presentation layer.
- **BR-TZ-04:** PostgreSQL `TimeZone` parameter is set to `UTC` in `postgresql.conf`.
- **BR-TZ-05:** All date-based business logic (e.g., "is today after end_date?") uses IST date comparison.

### 5.2 Area Management Rules
- **BR-AREA-01:** The areas list is dynamic — there are no predefined areas.
- **BR-AREA-02:** When adding the first-ever customer, the admin is prompted to type a new area name; this creates the first entry in the `areas` table.
- **BR-AREA-03:** For all subsequent customer additions, the area field shows a dropdown of all existing areas PLUS an "Add New Area..." option.
- **BR-AREA-04:** Selecting "Add New Area..." displays an inline text field where the admin types the new area name, which is saved to `areas` and then selected for the current customer.
- **BR-AREA-05:** Area names must be unique (case-insensitive comparison recommended).

### 5.3 Customer Status Rules
- **BR-CUST-01:** A customer is always in one of two statuses: `ACTIVE` or `SUSPENDED`.
- **BR-CUST-02:** A new customer starts as `ACTIVE`.
- **BR-CUST-03:** Unless a customer explicitly requests cancellation/suspension, they remain on the billing list (`ACTIVE`) indefinitely.
- **BR-CUST-04:** A suspended customer remains in the database and can re-enroll at any time.

### 5.4 Subscription Enrollment Rules
- **BR-SUB-01:** Each subscription's `monthly_rate` is set by the admin at the time of enrollment. There is no global fixed rate.
- **BR-SUB-02:** For a **new customer** enrolling mid-month: `start_date` = enrollment date; `end_date` = last day of the enrollment month. The amount is the full `monthly_rate` (no pro-rata discount — business decision).
  > _Example: Customer enrolls on April 15 → subscription runs April 15 to April 30._
- **BR-SUB-03:** For an **existing customer** renewing: `start_date` = 1st of the month being subscribed; `end_date` = last day of that month.
  > _Example: Admin records May payment on April 28 → subscription runs May 1 to May 31._
- **BR-SUB-04:** Subscriptions **do NOT auto-renew**. Each month's subscription must be explicitly recorded by the admin (i.e., when the customer pays).
- **BR-SUB-05:** Only one subscription can be `ACTIVE` per customer at any given time.

### 5.5 Grace Period & Payment Pending Rules
- **BR-PAY-01:** After a subscription's `end_date`, a **5-day grace period** begins.
- **BR-PAY-02:** During the grace period, the customer's subscription status is `GRACE` and `is_payment_pending = FALSE`.
- **BR-PAY-03:** If no payment is recorded after the 5-day grace period, the subscription status changes to `PAYMENT_PENDING` and `is_payment_pending = TRUE` on the customer record.
- **BR-PAY-04:** A scheduled background job runs **daily at 3:00 AM IST** to evaluate all ACTIVE customers and update statuses (GRACE → PAYMENT_PENDING transitions).
- **BR-PAY-05:** The main dashboard displays a **prominent alert/badge** showing the count of customers currently in `PAYMENT_PENDING` status.
- **BR-PAY-06:** When the admin records a payment for a PAYMENT_PENDING customer, the status reverts to `ACTIVE` (or a new subscription is created) and `is_payment_pending` is set to `FALSE`.

### 5.6 Cancellation / Suspension Rules
- **BR-SUS-01:** When a customer informs the business of cancellation/suspension, the admin marks the customer for suspension in the system.
- **BR-SUS-02:** The current active subscription **runs until its `end_date`** (no proration, no early termination).
- **BR-SUS-03:** After the subscription's `end_date`, the customer's status is automatically changed from `ACTIVE` to `SUSPENDED`. The subscription's status is set to `SUSPENDED`.
- **BR-SUS-04:** A suspended customer does NOT enter the GRACE or PAYMENT_PENDING flow.
- **BR-SUS-05:** A suspended customer has their `is_payment_pending` set to `FALSE`.
- **BR-SUS-06:** To re-enroll a suspended customer, the admin creates a new subscription for that customer. The customer status returns to `ACTIVE`.
- **BR-SUS-07:** The Set-top Box ID (`stb_id`) of a suspended customer may be reassigned to a new or different customer. The partial unique index ensures no two ACTIVE customers share an STB ID.

### 5.7 Export Rules
- **BR-EXP-01:** Exports are available in CSV and Excel (`.xlsx`) formats.
- **BR-EXP-02:** The following data can be exported:
  - **Customer List:** filter by area and/or month (last 5 years). Fields: Customer ID, Name, Phone, Email, Address (Door No, Street, Area), STB ID, UPI ID, Account Created Date, Status.
  - **Payment List:** filter by area and/or month (last 5 years). Fields: Customer ID, Name, Area, Subscription Period, Amount Paid, Payment Date, Payment Method.
  - **Pending Payment List:** filter by date + area, or date only (all areas), or month (last 5 years). Fields: Customer ID, Name, Phone, Area, Subscription End Date, Days Overdue, Amount Due.

### 5.8 Customer Portal Access Rules

- **BR-CP-01:** A customer can log in to the portal using their registered phone number or email and a password set by the admin at account creation (or reset by the admin on request).
- **BR-CP-02:** A logged-in customer can **only view their own data**. They cannot view, search, or access any other customer's information.
- **BR-CP-03:** The customer portal is **read-only**. A customer cannot modify any of their personal details, subscription information, or payment records.
- **BR-CP-04:** The customer portal displays:
  - **Personal Details:** Name, address (door number, street, area), phone, email, STB ID, account status (Active / Suspended), account creation date.
  - **Current Subscription:** Subscription period (start date → end date), monthly rate, subscription status (Active / Grace / Payment Pending / Suspended), payment due date.
  - **Subscription History — Last 12 Months:** A month-by-month table showing: Month, Subscription Period, Amount, Payment Status (Paid / Pending / Suspended / N/A), Payment Date.
- **BR-CP-05:** Sensitive fields — **UPI ID** and **payment method** — are **not visible** to the customer in the portal.
- **BR-CP-06:** The customer portal does **not** expose any admin-level information (other customers, reports, area management, dashboard totals, etc.).
- **BR-CP-07:** A customer's login credentials (password) are managed by the admin. The customer cannot self-register or self-reset their password in the MVP. Password reset is done by the admin on request.
- **BR-CP-08:** Customer login uses the same JWT-based authentication as admin login, but the JWT carries `ROLE_CUSTOMER` and the customer's own `customer_id`. Spring Security enforces that a customer can only access endpoints scoped to their own `customer_id`.

---

## 6. API Design Outline

Base URL: `https://mecs-billing.yourdomain.com/api`  
All endpoints require `Authorization` via JWT (HttpOnly cookie), except `/auth/login`.  
Interactive API docs available at `/swagger-ui.html` (springdoc-openapi).

> **Roles:**
> - `ADMIN` — Full access to all endpoints.
> - `CUSTOMER` — Read-only access to their own data only (scoped by `customer_id` in JWT).

### 6.1 Authentication

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/auth/login` | Login with email/phone + password. Returns JWT in HttpOnly cookie. Role determined from credentials. | Public |
| `POST` | `/auth/logout` | Invalidates the session / clears cookie. | Admin, Customer |
| `POST` | `/auth/refresh` | Refresh access token using refresh token. | Admin, Customer |

### 6.2 Area Management

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/areas` | List all areas (for dropdown population). | Admin |
| `POST` | `/areas` | Create a new area. Body: `{ "area_name": "..." }` | Admin |

### 6.3 Customer Management (Admin)

> All write operations on customers are **Admin-only**.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/customers` | List all customers (filterable by status, area). | Admin |
| `POST` | `/customers` | Add a new customer. | Admin |
| `GET` | `/customers/{id}` | Get a specific customer's full details. | Admin |
| `PUT` | `/customers/{id}` | Update customer details. | Admin |
| `DELETE` | `/customers/{id}` | Delete (soft-delete) a customer record. | Admin |
| `PUT` | `/customers/{id}/suspend` | Mark customer for suspension (takes effect at subscription end). | Admin |
| `PUT` | `/customers/{id}/reenroll` | Re-enroll a suspended customer (creates new subscription). | Admin |
| `PUT` | `/customers/{id}/reset-password` | Admin resets a customer's portal password. | Admin |

### 6.4 Customer Portal (Customer Self-View)

> All endpoints here are **read-only** and automatically scoped to the authenticated customer's own `customer_id`. A customer cannot pass a different ID.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/portal/me` | Get own personal details (name, address, phone, email, STB ID, status, account created date). UPI ID is excluded. | Customer |
| `GET` | `/portal/me/subscription/current` | Get current subscription details (period, rate, status, due date). | Customer |
| `GET` | `/portal/me/subscription/history` | Get subscription history for the past 12 months, month-by-month (month, period, amount, payment status, payment date). | Customer |

### 6.5 Subscription Management

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/subscriptions` | Enroll a customer in a new subscription (new or renewal). | Admin |
| `GET` | `/subscriptions/{customerId}` | Get full subscription history for a customer. | Admin |
| `GET` | `/subscriptions/{customerId}/current` | Get current active subscription. | Admin |

### 6.6 Payment Management

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/payments` | Record a payment for a customer's subscription. | Admin |
| `GET` | `/payments` | List payments (filterable by customerId, month, year, area). | Admin |

### 6.7 Dashboard

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Returns: total active customers, total suspended, count of payment pending, count in grace period. | Admin |

### 6.8 Reports & Export

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/reports/customers/export` | Export customer list. Query params: `area`, `month`, `year`, `format` (csv/xlsx). | Admin |
| `GET` | `/reports/payments/export` | Export payment list. Query params: `area`, `month`, `year`, `format`. | Admin |
| `GET` | `/reports/pending/export` | Export pending payment list. Query params: `area`, `date`, `month`, `year`, `format`. | Admin |

### 6.9 Admin Profile

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/admin/profile` | Get admin profile details. | Admin |
| `PUT` | `/admin/profile` | Update admin profile (name, phone, email). | Admin |
| `PUT` | `/admin/password` | Change admin password (requires current password confirmation). | Admin |

---

## 7. Security Considerations

### 7.1 Authentication & Authorization
- **Password Hashing:** BCrypt with cost factor ≥ 12. Passwords are never stored in plaintext — applies to both admin and customer passwords.
- **JWT Strategy:**
  - Short-lived **access token** (15-minute expiry).
  - Long-lived **refresh token** (7-day expiry).
  - Both tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies (never in `localStorage`).
  - JWT payload includes `role` (`ROLE_ADMIN` or `ROLE_CUSTOMER`) and, for customers, their `customer_id`.
- **Role-Based Access Control (RBAC):**
  - `ROLE_ADMIN`: Full access to all API endpoints.
  - `ROLE_CUSTOMER`: Access restricted to `/portal/me/**` endpoints only, automatically scoped to their own `customer_id`. Attempting to access admin endpoints returns HTTP 403.
  - Enforced via Spring Security's method-level security (`@PreAuthorize`) and path-level security configuration.
  - **A customer cannot access or modify any other customer's data** — the backend validates that the `customer_id` in the JWT matches the requested resource on every `/portal/` request.

### 7.2 Transport Security
- **HTTPS enforced** via Cloudflare (fully managed — no certificate setup or renewal needed).
- Cloudflare Tunnel encrypts the connection between Cloudflare's edge and the laptop at all times.
- The Spring Boot app on the laptop only listens on `localhost:8080` — it is **never directly exposed to the internet**.
- **HSTS** and security headers can be configured via Cloudflare dashboard at no cost.

### 7.3 Network Security (Cloudflare Tunnel Advantages)
- **No open inbound ports** on the laptop or router — eliminates the most common attack surface for self-hosted servers.
- **No port-forwarding rules** on the home router — reduces misconfiguration risk.
- **Works behind CGNAT** (Carrier-Grade NAT) — common with Indian ISPs (Jio, BSNL) where port-forwarding is impossible. Cloudflare Tunnel works regardless.
- **DDoS protection** built into Cloudflare's edge — absorbs volumetric attacks before they reach the laptop.
- **Cloudflare Zero Trust (optional future hardening):** Restrict access to the app by email domain, IP country, or device certificate — all free for small teams.

### 7.4 API Security
- **CORS:** Restricted to the exact frontend origin (`mecs-billing.yourdomain.com`). No wildcard `*`.
- **Rate Limiting:** Login endpoint `/api/auth/login` limited to 5 failed attempts per 15 minutes per IP. Can be enforced at Cloudflare WAF level (free tier) in addition to Spring's filter.
- **CSRF Protection:** JWT cookie approach with `SameSite=Strict` mitigates CSRF risk.
- **Input Validation:** All API request bodies validated with `@Valid` and Bean Validation (`@NotBlank`, `@Size`, etc.).
- **SQL Injection Prevention:** Spring Data JPA with parameterized queries via Hibernate (no raw string-concatenated SQL).
- **No sensitive data in URLs:** Passwords, tokens, and UPI IDs never appear in query parameters or URL paths.

### 7.5 Infrastructure Security
- **Firewall (`ufw`):** All inbound ports closed except **22 (SSH, local network only)**. No ports 80/443 need to be open — Cloudflare Tunnel is outbound-only.
- **SSH:** Key-based authentication only; password authentication disabled; `fail2ban` installed to block brute-force SSH attempts.
- **Principle of Least Privilege:** PostgreSQL has a dedicated app-user with only the permissions needed (no superuser).
- **Audit Logging:** All write operations (create, update, delete, suspend, payment) are recorded in `audit_logs` with actor, timestamp, and changed data.
- **Secrets Management:** Database credentials and JWT secret keys stored in environment variables or a `.env` file (never hardcoded or committed to Git).

### 7.6 Backup Security
- DB backup files (`.sql.gz`) stored in a directory accessible only to the server user (`chmod 700`).
- Optional off-site sync to Google Drive via `rclone` (uses OAuth2; credentials stored securely).

---

## 8. Deployment Guide Outline

### 8.1 Laptop Prerequisites
- **OS:** Ubuntu 22.04 LTS (recommended; stable, widely supported, strong systemd support)
- **Hardware:** Minimum 4 GB RAM, 50 GB free disk space
- **Power:** UPS (Uninterruptible Power Supply) to prevent data corruption on power failure
- **Network:** Any broadband connection — **no static IP or port-forwarding required** (Cloudflare Tunnel handles this)
- **Domain:** A domain name you own (e.g., from Namecheap or Cloudflare Registrar — ~₹800/year). Point its nameservers to Cloudflare (free plan).

> **No Nginx required.** Cloudflare Tunnel routes directly to Spring Boot on `localhost:8080`.

### 8.2 Software Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 17 (OpenJDK)
sudo apt install -y openjdk-17-jdk

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Maven
sudo apt install -y maven

# Install Git
sudo apt install -y git

# Install cloudflared (Cloudflare Tunnel daemon)
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Install rclone (for Google Drive backup sync)
curl https://rclone.org/install.sh | sudo bash
```

### 8.3 Cloudflare Tunnel Setup (Replaces DuckDNS + Port-Forwarding + Nginx + Certbot)

**One-time setup (~10 minutes):**

1. **Add your domain to Cloudflare** (free plan at [cloudflare.com](https://cloudflare.com)):
   - Sign up, add your domain, update your domain registrar's nameservers to Cloudflare's.

2. **Authenticate `cloudflared` on the laptop:**
   ```bash
   cloudflared tunnel login
   # Opens a browser — select your domain — credentials saved to ~/.cloudflared/
   ```

3. **Create a named tunnel:**
   ```bash
   cloudflared tunnel create mecs-billing
   # Outputs a Tunnel UUID — note it down
   ```

4. **Create the tunnel config file** at `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <YOUR-TUNNEL-UUID>
   credentials-file: /home/ubuntu/.cloudflared/<YOUR-TUNNEL-UUID>.json

   ingress:
     - hostname: mecs-billing.yourdomain.com
       service: http://localhost:8080
     - service: http_status:404
   ```

5. **Create the DNS route** (maps your subdomain to the tunnel):
   ```bash
   cloudflared tunnel route dns mecs-billing mecs-billing.yourdomain.com
   ```

6. **Install `cloudflared` as a systemd service** (auto-start on boot):
   ```bash
   sudo cloudflared service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```

7. **Verify:** Open `https://mecs-billing.yourdomain.com` in any browser from anywhere in the world. ✅

### 8.4 PostgreSQL Configuration

```sql
-- Create dedicated application user and database
CREATE USER mecs_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE mecs_db OWNER mecs_user;
GRANT ALL PRIVILEGES ON DATABASE mecs_db TO mecs_user;
```

In `/etc/postgresql/14/main/postgresql.conf`:
```
TimeZone = 'UTC'
```

### 8.5 Spring Boot Application Configuration

In `src/main/resources/application.properties`:
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/mecs_db
spring.datasource.username=${MECS_DB_USER}
spring.datasource.password=${MECS_DB_PASS}

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# Server — listens only on localhost (Cloudflare Tunnel connects here)
server.port=8080
server.address=127.0.0.1

# Timezone (JVM)
# Set via JVM flag: -Duser.timezone=UTC

# JWT
mecs.jwt.secret=${MECS_JWT_SECRET}
mecs.jwt.access-token-expiry-ms=900000
mecs.jwt.refresh-token-expiry-ms=604800000
```

> **`server.address=127.0.0.1`** ensures Spring Boot only accepts connections from `localhost` — i.e., only from the `cloudflared` daemon running on the same machine. No direct external access is possible.

Build the JAR:
```bash
mvn clean package -DskipTests
```

### 8.6 systemd Service for Spring Boot (Auto-start & Auto-restart)

Create `/etc/systemd/system/mecs-billing.service`:
```ini
[Unit]
Description=MECS Cable TV Billing Application
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/mecs
ExecStart=/usr/bin/java -Duser.timezone=UTC -jar /opt/mecs/mecs-billing.jar
EnvironmentFile=/opt/mecs/.env
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mecs-billing
sudo systemctl start mecs-billing
```

### 8.7 Firewall Configuration (Locked Down — No Open Web Ports)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.0.0/24 to any port 22  # SSH from local network only
sudo ufw enable
```

> Ports 80 and 443 do **not** need to be opened. Cloudflare Tunnel operates entirely on outbound connections.

### 8.8 Automated Daily DB Backup (3:00 AM IST = 21:30 UTC previous day)

Create `/opt/mecs/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/mecs/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="mecs_db_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump -U mecs_user mecs_db | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Optional: sync to Google Drive (configure rclone first)
# rclone copy "$BACKUP_DIR/$FILENAME" gdrive:mecs-backups/
```

```bash
chmod +x /opt/mecs/backup.sh
```

Add to crontab (`crontab -e`):
```cron
# Run at 21:30 UTC = 3:00 AM IST
30 21 * * * /opt/mecs/backup.sh >> /var/log/mecs/backup.log 2>&1
```

### 8.9 Maintenance Checklist (Monthly)
- [ ] Check `sudo systemctl status mecs-billing` — ensure Spring Boot is running
- [ ] Check `sudo systemctl status cloudflared` — ensure tunnel is connected
- [ ] Verify backup files exist in `/opt/mecs/backups/` and are current
- [ ] Run `sudo apt update && sudo apt upgrade -y` (during scheduled maintenance window)
- [ ] Check disk space: `df -h`
- [ ] Check logs: `sudo journalctl -u mecs-billing --since "1 month ago" | grep -i error`
- [ ] Check Cloudflare Tunnel health at [dash.cloudflare.com](https://dash.cloudflare.com) → Zero Trust → Tunnels

---

## 9. Future Scope

The system is designed with extensibility in mind. The following features are planned for future phases:

| Feature | Phase | Notes |
|---|---|---|
| **Employee Role (RBAC)** | Phase 2 | Only admin can create employees. Employees can record payments but cannot manage admin settings. Spring Security roles already structured to support this. |
| **Customer Portal — Password Self-Reset** | Phase 2 | Allow customers to reset their own password via OTP sent to registered phone/email. Requires SMS/email integration. |
| **Customer Portal — Payment History (Full)** | Phase 2 | Extend the customer portal to show full payment history beyond 12 months. |
| **Cloudflare Zero Trust Access** | Phase 2 | Restrict the admin panel by email allowlist or country — free for up to 50 users via Cloudflare's Zero Trust free tier. |
| **UPI Payment Request Integration** | Phase 3 | Automate payment collection via PhonePe or Razorpay API. The `upi_id` field is already stored per customer. |
| **SMS / WhatsApp Payment Reminders** | Phase 3 | Send automated reminders to customers during grace period. Via Twilio, MSG91, or WhatsApp Business API. |
| **Mobile App** | Phase 3 | React Native app reusing the existing REST API — no backend changes required. Customer portal translates directly to a mobile view. |
| **Dashboard Analytics** | Phase 2 | Monthly revenue graph, area-wise customer count, payment trends over 12 months. |
| **Two-Factor Authentication (2FA)** | Phase 2 | TOTP-based 2FA (Google Authenticator) for admin login. |
| **Multi-Admin Support** | Phase 2 | Support for multiple admin accounts with individual credentials. |
| **Off-site Backup (rclone)** | Phase 1.5 | Sync nightly `pg_dump` to Google Drive (15 GB free). Already scripted in backup guide. |
| **Health Check / Uptime Monitor** | Phase 1.5 | Free tier of `healthchecks.io` or UptimeRobot to alert admin if the server goes down. |

---

## 10. Open Questions & Decisions Log

| # | Question | Decision / Answer | Date |
|---|---|---|---|
| 1 | Subscription cancellation policy | Run until month end, then stop. No refund or proration. | April 2026 |
| 2 | Set-top Box ID uniqueness | Can be reassigned to a new customer after the original customer is suspended. Partial unique index enforces uniqueness among ACTIVE customers only. | April 2026 |
| 3 | Areas list | Dynamic — no predefined list. Admin adds areas as needed. First customer triggers area creation prompt. | April 2026 |
| 4 | Monthly subscription rate | Not a global setting. Set by admin per customer per enrollment. | April 2026 |
| 5 | Subscription auto-renewal | No auto-renewal. Admin manually records each month's subscription (triggered by payment receipt). | April 2026 |
| 6 | Grace period duration | 5 days after subscription end date. After grace period, customer enters PAYMENT_PENDING. | April 2026 |
| 7 | Suspension business logic | Customer stays ACTIVE unless they explicitly request suspension/cancellation. After suspension, they are SUSPENDED (not deleted). They can re-enroll anytime. | April 2026 |
| 8 | Employee role in MVP | Deferred. Only admin login in MVP. Employee role scaffolded but not activated. | April 2026 |
| 9 | New customer pro-rata billing | Full monthly rate charged regardless of enrollment date (no pro-rata discount). Business decision. ⚠️ **Revisit if needed.** | April 2026 |
| 10 | Frontend framework | React.js chosen for future-proofing (mobile app reuse). Thymeleaf is an alternative if simplicity is preferred. | April 2026 |
| 11 | Global access method | **Cloudflare Tunnel (free)** chosen over DuckDNS + port-forwarding. Reasons: no open inbound ports, no static IP needed, SSL auto-managed, DDoS protection, works behind CGNAT (common with Indian ISPs). Nginx removed from stack. | April 2026 |
| 12 | Customer access level | Customers have a **read-only** portal login. They can view their own personal details, current subscription, and last 12 months of subscription history (month-wise). Only the admin can add, update, or delete any customer record. UPI ID is hidden from customer view. Customer password is set/reset by admin only (MVP). | April 2026 |

---

*End of Document*

---
> **Business Name:** MECS — Madura Education and Communication Systems, Madurai, Tamil Nadu, India  
> **Software:** MECS Cable TV Billing Software  
> **Maintained by:** Development Team  
> **Next Review:** When Phase 2 development begins
