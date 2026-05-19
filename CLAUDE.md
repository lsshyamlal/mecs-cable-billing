# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is in the **planning/design phase**. The repository currently contains only documentation; no source code, `pom.xml`, or `package.json` exists yet. Refer to `MECS_Software_Documentation.md` (45 KB) and `Project_Summary.md` for full context before implementing anything.

## Tech Stack

- **Backend:** Java 17+ / Spring Boot 3.x, Spring Security + JWT, Spring Data JPA / Hibernate
- **Frontend:** React 18.x, Tailwind CSS / Bootstrap
- **Database:** PostgreSQL 14+ (all timestamps in IST / Asia/Kolkata)
- **Build:** Maven (`pom.xml` to be created)
- **API Docs:** Springdoc-OpenAPI (Swagger UI at `/swagger-ui.html`)

## Build & Run Commands

Once source code is scaffolded:

```bash
# Build (skip tests for a fast package)
mvn clean package -DskipTests

# Run
java -Duser.timezone=Asia/Kolkata -jar target/mecs-billing.jar

# Run tests
mvn test

# Run a single test class
mvn test -Dtest=CustomerServiceTest
```

**Required environment variables** (never hardcode in source):
```
MECS_DB_USER      # PostgreSQL username
MECS_DB_PASS      # PostgreSQL password
MECS_JWT_SECRET   # JWT signing secret
```

## Architecture

Three-tier layered Spring Boot application:

```
React SPA (Admin Dashboard + Customer Portal)
        ↕ REST/JSON over HTTPS
Spring Boot (localhost:8080)
  └── Controllers → Services → Repositories (JPA)
  └── Spring Security: JWT in HttpOnly cookies
        ↕ SQL
PostgreSQL (UTC timezone)
```

**Global access:** Cloudflare Tunnel (`cloudflared`) routes the public domain to `localhost:8080` via an outbound-only encrypted connection. No Nginx, no open inbound ports, no static IP required. The JVM never serves TLS directly — Cloudflare terminates it.

**Deployment:** systemd service (`/etc/systemd/system/mecs-billing.service`) with auto-restart. Daily `pg_dump` backup at 3 AM IST (cron), 30-day rotation.

## Database Schema (Core Tables)

| Table | Key fields / notes |
|---|---|
| `admins` | Email + BCrypt password hash |
| `areas` | Admin-managed geographic areas |
| `customers` | STB ID (unique among ACTIVE only — partial index), subscription status |
| `subscriptions` | Status: ACTIVE / GRACE / PAYMENT\_PENDING / SUSPENDED / CANCELLED |
| `payments` | Amount, date, method, recorded-by admin |
| `audit_logs` | Every write operation logged (entity, action, admin, timestamp) |

All timestamps stored as UTC; business logic and display convert to IST (`Asia/Kolkata`, UTC+5:30).

## Critical Business Rules

- **Billing period:** New customers billed from enrollment date to month-end (no pro-rata). Existing customers billed 1st–last of month.
- **Grace period:** Payment is due on the subscription start date (1st of the month for recurring customers). Each area has a configurable `gracePeriodDay` (day-of-month). The scheduler at 3 AM IST: (1) moves ACTIVE subscriptions to GRACE on their start date, (2) moves GRACE subscriptions to PAYMENT\_PENDING once `today` is past `gracePeriodDay` of the subscription's start month. Service is suspended immediately upon PAYMENT\_PENDING.
- **No auto-renewal:** Admin records each monthly payment manually.
- **Cancellation:** Subscription runs to month-end, then auto-suspends. No pro-rata refund.
- **STB ID uniqueness:** Unique only among ACTIVE customers (partial unique index); can be reassigned to a new customer after the original is suspended.
- **Customer portal:** Read-only. Customers see only their own data (last 12 months). Admins manage all changes.

## Security Constraints

- JWT: access token 15-min expiry, refresh token 7-day expiry, stored in HttpOnly + Secure + SameSite=Strict cookies.
- Two roles: `ROLE_ADMIN` (full CRUD) and `ROLE_CUSTOMER` (read-only own data).
- All SQL via parameterized queries (JPA/JPQL — no string concatenation).
- CORS restricted to the Cloudflare-fronted domain only.
- Rate limiting on login endpoint.
- All write operations must emit an `audit_logs` entry.
