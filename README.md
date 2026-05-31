# MECS Cable Billing

Billing and subscription-management software for a local cable TV operator. Admin dashboard for managing customers, areas, packs, payments, and reports, plus a read-only customer portal.

## Tech Stack

- **Backend:** Java 21 / Spring Boot, Spring Security + JWT, Spring Data JPA, Flyway
- **Frontend:** React + Vite, Tailwind CSS
- **Database:** PostgreSQL (timestamps stored as TIMESTAMPTZ; displayed in IST)
- **Build:** Maven

## Run

```bash
# Backend (dev profile binds to port 9090)
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend
cd frontend && npm install && npm run dev
```

Required env vars: `MECS_DB_USER`, `MECS_DB_PASS`, `MECS_JWT_SECRET`.

See `MECS_Software_Documentation.md`, `APP_FLOWS.md`, and `GCP_MIGRATION.md` for design details.

---

## Change Log

Chronological one-liner per commit on `feature/dev-work`. Timestamps are commit author date in local time (`YYYY-MM-DD HH:MM`).

### Project scaffold & core backend
- `2026-05-18 01:02` — Initial commit
- `2026-05-18 01:13` — Initial commit: project documentation and CLAUDE.md
- `2026-05-18 01:44` — Scaffold Spring Boot 4.0.6 project with Java 21
- `2026-05-18 02:34` — Add JPA entities, Flyway explicit config, Java 25 update
- `2026-05-18 02:36` — Add JPA repositories for all entities
- `2026-05-18 02:48` — Add Security/JWT layer and fix Lombok + Flyway ordering
- `2026-05-18 03:02` — Add Auth Service, Controller, DTOs, and exception handling
- `2026-05-18 03:09` — Add DevDataInitializer to fix dev admin password on startup
- `2026-05-18 03:42` — Add area, customer, payment management and regression test suite
- `2026-05-18 03:50` — Add daily billing scheduler and manual trigger endpoint
- `2026-05-18 03:53` — Add development summary document
- `2026-05-18 03:55` — Merge pull request #2 from lsshyamlal/claude/ecstatic-maxwell-236eda
- `2026-05-18 04:01` — Convert properties config to YAML

### Reporting & area config
- `2026-05-18 04:19` — Add reports with CSV and Excel export
- `2026-05-18 15:38` — Add per-area grace period and auto-logout on session expiry
- `2026-05-18 15:43` — Show grace period deadline in subscription history
- `2026-05-18 15:50` — Add test data reset script for all billing scenarios
- `2026-05-18 15:54` — Fix regression test area creation to include gracePeriodDay

### Admin UI
- `2026-05-18 16:15` — Add admin UI with dashboard, customers, areas, and reports
- `2026-05-18 16:18` — Add show/hide password toggle to login page
- `2026-05-18 16:35` — Store and display all timestamps in IST (Asia/Kolkata)
- `2026-05-18 16:37` — Add test data for 2-year suspended-access boundary validation
- `2026-05-18 17:03` — Fix login interceptor masking auth errors as session expired
- `2026-05-18 17:05` — Show area as a dedicated field on the My Account page
- `2026-05-18 20:22` — Show expired user name on session timeout redirect

### Grace period rework & admin profile
- `2026-05-18 20:25` — Rework grace period: payment due on subscription start date, not end date
- `2026-05-18 21:31` — Add admin profile editing: view and update profile info, change password
- `2026-05-18 21:39` — Show grace period deadline on admin Customers tab

### Customer status & dashboard split
- `2026-05-18 22:00` — Separate customer status from payment status; add Account Closed state
- `2026-05-18 22:04` — Split dashboard tiles into Customer Status and Subscription Status sections
- `2026-05-18 22:11` — Add APP_FLOWS.md documenting all application flows
- `2026-05-18 22:13` — Fix subscription lifecycle flow: next ACTIVE subscription created at payment time, not month rollover
- `2026-05-18 22:15` — Fix close account: add missing DB migration and show errors in red
- `2026-05-18 22:18` — Fix currentPaymentDueDate set to subscription start, not end

### Re-enrollment & subscription state
- `2026-05-18 22:26` — Fix re-enrollment showing CANCELLED subscription status
- `2026-05-18 22:36` — Show PAID status after payment; advance subscription via scheduler
- `2026-05-18 22:40` — Create subscription as GRACE when start date is today or past
- `2026-05-18 22:49` — Clarify re-enroll form: pre-populate rate, rename field, add note
- `2026-05-18 22:58` — Re-enroll sets subscription to PAYMENT_PENDING; remove rate from form

### Dashboard & payments polish
- `2026-05-18 23:10` — Dashboard: add Suspended/Paid tiles; fix Active count and tile layout
- `2026-05-18 23:44` — Store payment date as timestamp (TIMESTAMPTZ) for accurate records
- `2026-05-20 20:07` — Fix session expiry: queue concurrent 401s during token refresh
- `2026-05-20 20:07` — Scheduler: show move counts after manual run
- `2026-05-20 20:08` — Fix deploy script Java path and relax CORS for Cloudflare Tunnel
- `2026-05-20 20:08` — gitignore: exclude data exports, cookies, and Claude internals
- `2026-05-20 20:29` — Session: 2-hour idle timeout and server restart auto-logout
- `2026-05-20 21:32` — Fix: enforce unique phone number to prevent duplicate customer login failure
- `2026-05-20 22:01` — Fix: mark current-month subscriptions PAID on account close

### UI refinements
- `2026-05-20 22:04` — UI: show Area as a separate field on customer detail page
- `2026-05-20 22:10` — UI: add subscription status column to payment history table
- `2026-05-20 22:20` — Fix: remove monthly rate from new customer form
- `2026-05-20 22:37` — UI: replace type=month with Month/Year dropdowns in Record Payment modal
- `2026-05-20 22:46` — UI: replace native confirm dialogs with in-app modals; harden Record Payment form
- `2026-05-20 22:47` — Fix: remove redundant audit log notes for admin self-service actions
- `2026-05-20 22:53` — Fix: record payment timestamp server-side instead of accepting date from client
- `2026-05-20 22:54` — UI: fix misaligned components in Add New Area form
- `2026-05-20 22:57` — UI: disable Record Payment button for suspended/closed customers
- `2026-05-20 23:01` — UI: move status badge into Customer Info card; darken Account Closed badge
- `2026-05-20 23:05` — UI: differentiate customer vs subscription status badges; fix Paid color

### Area management & packs
- `2026-05-20 23:15` — Feature: edit area from UI; fix dashboard tiles not refreshing after scheduler run
- `2026-05-21 00:13` — Feature: payment-aware account close; Suspended/Cancelled subscription tiles; Add Area quick action
- `2026-05-21 00:14` — UI: adjust customer status tile colors to medium-shade tints
- `2026-05-21 00:54` — Feature: subscription packs management (backend + UI)
- `2026-05-21 01:06` — Feature: pack selection in payment recording; pack on subscription

### Dashboard split & theming
- `2026-05-21 01:07` — Fix: return 401 (not 403) for unauthenticated requests; split dashboard subscription status into Current / Future sections
- `2026-05-21 02:02` — Fix: align currentPaymentDueDate with subscriptionStart; futureStatus filter on customer list; clickable dashboard tiles
- `2026-05-21 02:19` — Feature: monthly payment totals on dashboard; tile hierarchy with pop-out/inner styling
- `2026-05-23 12:04` — Feature: light/dark mode toggle across the entire application
- `2026-05-23 13:48` — Config: bind dev profile to port 9090

### Docs & status rename
- `2026-05-30 08:35` — Add code-derived application flow summary
- `2026-05-30 08:39` — Rename subscription status ACTIVE to SCHEDULED
- `2026-05-30 15:08` — Docs: correct APP_FLOWS lifecycle diagrams against actual code
- `2026-05-30 15:09` — Refactor: drop redundant isPaymentPending field
- `2026-05-30 15:09` — Test: update regression script for isPaymentPending removal and API changes

### Config & cleanup
- `2026-05-30 15:09` — Config: allow curl commands in project settings
- `2026-05-30 15:10` — Revert "Config: allow curl commands in project settings"
- `2026-05-30 15:11` — Config: remove auto-added tool permissions from settings.local.json
- `2026-05-30 15:22` — Fix: SUSPENDED status handling, null-safety, and report UX
- `2026-05-30 15:29` — Fix: update Vite proxy target to correct port and IPv4 address
- `2026-05-30 15:43` — Fix: resolve flex layout conflict in Record Payment "For Month" dropdowns

### Latest changes
- `2026-05-30 16:15` — Feat: add customer account status history tracking
- `2026-05-30 16:42` — Feat: enforce single active session and cross-tab auth sync
- `2026-05-30 17:19` — Docs: add GCP migration plan for moving app off local Mac
- `2026-05-30 20:34` — Feat: expand customer address into city → area → street hierarchy
