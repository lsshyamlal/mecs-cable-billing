# MECS Cable Billing — Development Summary

## Tech Stack
Java 21 · Spring Boot 4.0.6 · Spring Security + JWT · Spring Data JPA · PostgreSQL · Flyway · Maven

---

## What Was Built (8 commits)

### 1. Project Scaffold
- Maven project initialized with Spring Boot 4.0.6, Java 21
- `application.properties` with dev/prod profiles
- Springdoc-OpenAPI wired for Swagger UI at `/swagger-ui.html`

### 2. Database Schema (Flyway migrations)
- `V1__init_schema.sql` — full schema: `admins`, `areas`, `customers`, `subscriptions`, `payments`, `audit_logs`
- `V2__add_customer_password.sql` — customer self-service login support
- Partial unique index on STB ID (unique among ACTIVE customers only)

### 3. JPA Entities
`Admin`, `Area`, `Customer`, `Subscription`, `Payment`, `AuditLog` + enums `CustomerStatus`, `SubscriptionStatus`

### 4. Repositories
JPA repositories for all six entities with custom query methods

### 5. Security / JWT Layer
- `JwtService` — token generation, validation, claims extraction
- `JwtAuthFilter` — per-request token verification
- `AdminUserDetailsService` + `CustomerUserDetailsService` — dual-role auth
- `SecurityConfig` — route-level access rules, HttpOnly cookie config
- `UserPrincipal` — unified principal wrapping both roles

### 6. Auth (Login / Logout / Password Reset)
- `AuthController` + `AuthService`
- Admin login, customer login, logout (cookie clear), password reset
- DTOs: `LoginRequest`, `LoginResponse`, `ResetPasswordRequest`, `ErrorResponse`
- `GlobalExceptionHandler` for consistent error responses

### 7. Core Business APIs
| Domain | Controller | Service | Key Operations |
|---|---|---|---|
| Areas | `AreaController` | `AreaService` | CRUD for geographic areas |
| Customers | `CustomerController` | `CustomerService` | Enroll, update, suspend, list by area, STB lookup |
| Payments | `PaymentController` | `PaymentService` | Record payment, list by customer, payment history |
| Audit | — | `AuditService` | Auto-log every write operation |

DTOs covering all request/response shapes for each domain.

### 8. Billing Scheduler
- `BillingScheduler` — daily cron at 3 AM IST
- Advances subscription statuses: ACTIVE → GRACE (day 1–5 after end) → PAYMENT_PENDING → SUSPENDED
- `AdminController` exposes `/api/admin/billing/run` for manual trigger

### 9. Dev Utilities
- `DevDataInitializer` — seeds a default admin on startup in dev profile (fixes BCrypt password on each restart)
- `FlywayConfig` — explicit Flyway bean to control migration ordering

---

## What Is NOT Built Yet
- Frontend (React SPA)
- Customer-facing read-only portal endpoints
- Full regression / integration test suite (only a context-loads smoke test exists)
- Production deployment config (systemd service, Cloudflare tunnel)
