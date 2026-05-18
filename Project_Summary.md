# MECS Cable Billing Software - Project Summary

**Project Date**: April 18, 2026  
**Purpose**: Create a web-based billing system for Cable TV business

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Requirements Summary](#requirements-summary)
3. [Feasibility Analysis](#feasibility-analysis)
4. [Technology Stack](#technology-stack)
5. [Implementation Timeline](#implementation-timeline)
6. [Key Challenges & Solutions](#key-challenges--solutions)
7. [Starting Point - Step by Step](#starting-point---step-by-step)
8. [Phase Breakdown](#phase-breakdown)
9. [Development Tools](#development-tools)
10. [Critical Success Factors](#critical-success-factors)
11. [Ambiguities to Clarify](#ambiguities-to-clarify)

---

## Project Overview

### What is MECS Cable Billing Software?
A web-based billing system for managing Cable TV customer subscriptions, payments, and billing operations for a cable TV business.

### Who is it for?
- **Admin**: Full control over system, users, customers, billing
- **Employees**: Customer and payment management
- **Customers**: View their account, payments, subscriptions (future scope)

### Key Constraints
- ✅ **Zero/Minimal Costs**: No cloud provider expenses, entirely open-source
- ✅ **Local Hosting**: Runs on a laptop server 24/7
- ✅ **Global Access**: Accessible from anywhere in the world
- ✅ **IST Timezone**: All operations in IST regardless of user location
- ✅ **Security Critical**: Must not be easily hacked or exploited
- ✅ **Easy Maintenance**: Understandable by CS college students

---

## Requirements Summary

### Functional Requirements

#### 1. Authentication & Access Control
- Admin, Employee, and Customer login system
- Sign-up capability for customers (future)
- Role-based access control

#### 2. Customer Management
- Add new customer
- Update existing customer information
- View customer details
- Delete customer (if needed)

#### 3. Subscription Management
- **New Customer Subscription**: Bill from subscription date to end of month
- **Existing Customer Subscription**: Bill from 1st to end of month
- **Subscription Cancellation**: (Need to clarify: until month-end or pro-rata?)
- Monthly subscription renewal

#### 4. Payment Tracking
- Record payment amounts and dates
- Calculate current payment due date
- Track payment status (pending/paid)
- Last payment history

#### 5. Reporting & Export
- **Pending Payment List**:
    - Date + Area wise
    - Date wise (all areas)
- **Customer List Export**:
    - Per area wise
    - Per any month for last 5 years
    - Format: CSV or Excel
- **Payment List Export**:
    - Per area wise
    - Per any month for last 5 years

#### 6. Daily Operations
- Daily database snapshots at 3:00 AM IST
- Maintenance windows scheduled daily

---

## Feasibility Analysis

### Overall Assessment: ✅ **YES, HIGHLY FEASIBLE**

| Aspect | Feasibility | Confidence | Notes |
|--------|------------|-----------|-------|
| Web Application | ✅ Easy | 95% | Standard tech stack |
| Java Backend | ✅ Easy | 95% | Spring Boot perfect for this |
| Open-Source DB | ✅ Easy | 98% | PostgreSQL/MySQL mature |
| Security Implementation | ✅ Achievable | 85% | Standard practices sufficient |
| 24/7 Laptop Hosting | ✅ Feasible | 80% | Requires UPS, monitoring |
| IST Timezone Handling | ✅ Easy | 99% | Java has excellent support |
| Daily DB Backups | ✅ Easy | 98% | Cron jobs automate this |
| Global Accessibility | ✅ Achievable | 75% | Needs port forwarding + security |
| UI/UX Design | ✅ Easy | 90% | Requirements are straightforward |

### Risk Assessment
- **Low Risk**: Database design, core APIs, authentication
- **Medium Risk**: Global accessibility setup, security hardening
- **Manageable**: 24/7 availability (needs monitoring)

---

## Technology Stack

### Recommended Stack

```
┌─────────────────────────────────────────┐
│         FRONTEND (UI Layer)             │
├─────────────────────────────────────────┤
│  React.js / Vue.js (or HTML/CSS/JS)     │
│  Bootstrap/Tailwind CSS (styling)       │
│  Axios (HTTP client)                    │
└─────────────────────────────────────────┘
           ↓ API Calls (REST)
┌─────────────────────────────────────────┐
│         BACKEND (Application Layer)     │
├─────────────────────────────────────────┤
│  Java 17+ with Spring Boot 3.x          │
│  Spring Security (authentication)       │
│  Spring Data JPA (ORM)                  │
│  Maven (dependency management)          │
│  JWT (token-based auth)                 │
└─────────────────────────────────────────┘
           ↓ SQL Queries
┌─────────────────────────────────────────┐
│         DATABASE (Data Layer)           │
├─────────────────────────────────────────┤
│  PostgreSQL 14+ (open-source)           │
│  Or MySQL 8+ (alternative)              │
└─────────────────────────────────────────┘
```

### Infrastructure
- **Server**: Java application on laptop
- **Reverse Proxy**: Nginx or Apache (port forwarding)
- **SSL/TLS**: Let's Encrypt (free HTTPS)
- **Automation**: Bash scripts + Cron jobs
- **Containerization**: Docker (optional, recommended)
- **Monitoring**: Basic logging + health checks

### Development Tools
- **IDE**: IntelliJ IDEA Community (free) or VS Code
- **Version Control**: Git + GitHub (private repo)
- **API Testing**: Postman or Insomnia
- **Database Client**: pgAdmin (PostgreSQL) or MySQL Workbench
- **Diagramming**: Draw.io or Lucidchart (ER diagrams)

---

## Implementation Timeline

### Overall Duration: **9-13 Weeks** (2-3 months)

| Phase | Duration | Key Activities |
|-------|----------|-----------------|
| **Phase 0: Pre-Dev** | 1 week | Requirements clarification, DB schema design, env setup |
| **Phase 1: Project Setup** | 1-2 weeks | Spring Boot scaffolding, API design, project structure |
| **Phase 2: Core Backend** | 3-4 weeks | Authentication, Customer CRUD, Subscription logic, Payments |
| **Phase 3: Frontend & Integration** | 2-3 weeks | UI development, API integration, testing |
| **Phase 4: Security & DevOps** | 2 weeks | HTTPS, backup automation, security hardening |
| **Phase 5: Deployment & Training** | 1 week | Laptop setup, monitoring, documentation |

---

## Key Challenges & Solutions

### Challenge 1: Global Accessibility from Laptop
**Problem**: How to access the system from anywhere when hosted on a laptop?

**Solutions**:
1. **Dynamic DNS + Port Forwarding**
    - Use DuckDNS (free) for domain name
    - Configure router port forwarding
    - Best for private networks

2. **Reverse Proxy (Recommended)**
    - Nginx in front of Spring Boot
    - Cleaner, more professional setup

3. **VPN Layer** (Most Secure)
    - Add OpenVPN or Wireguard
    - Access only through VPN tunnel

**Recommendation**: Use Nginx reverse proxy + port forwarding for simplicity

---

### Challenge 2: 24/7 Reliability
**Problem**: Laptop must run continuously without interruptions.

**Solutions**:
1. **Hardware**:
    - Install UPS (Uninterruptible Power Supply)
    - Use stable power supply
    - Ensure good ventilation (laptop cooling)

2. **Software**:
    - Run as systemd service (auto-restart on failure)
    - Implement health checks
    - Set up monitoring/alerts

3. **Maintenance**:
    - Schedule downtime windows (e.g., 2-3 AM daily)
    - Gradual updates (not forced restarts)

**Recommendation**: UPS + systemd service + daily maintenance window

---

### Challenge 3: Security (Critical)
**Problem**: Must prevent hacking/exploitation for financial data.

**Solutions**:
1. **Authentication & Authorization**:
    - bcrypt password hashing (OWASP compliant)
    - JWT tokens for session management
    - Role-based access control (RBAC)
    - Multi-factor authentication (optional, future)

2. **Data Protection**:
    - HTTPS/TLS with Let's Encrypt
    - SQL injection prevention (parameterized queries)
    - Input validation on all fields
    - Rate limiting on APIs

3. **Network Security**:
    - Firewall rules (limit access to known IPs)
    - VPN for admin access (recommended)
    - Regular security audits

4. **Database Security**:
    - User-level DB access control
    - Encrypted backups
    - Regular integrity checks

**Recommendation**: Implement all basics + VPN for admin access

---

### Challenge 4: Data Consistency & Backups
**Problem**: Daily 3 AM IST snapshots while system may be in use.

**Solutions**:
1. **Backup Strategy**:
    - Use `pg_dump` for PostgreSQL (doesn't lock DB)
    - Store locally + external drive
    - Rotate backups (keep 30 days)

2. **IST Timezone Handling**:
    - Set system timezone to IST
    - Store all times in UTC, display in IST
    - Java handles this automatically

3. **Recovery Testing**:
    - Monthly backup restoration tests
    - Document recovery procedures

---

### Challenge 5: Mobile Accessibility (Future)
**Problem**: Requirements mention mobile app in future scope.

**Solutions**:
- Build backend REST API first (already mobile-ready)
- Create React Native / Flutter app later
- Reuse 100% of backend code

---

## Starting Point - Step by Step

### Week 1: Pre-Development Phase

#### Day 1-2: Clarify Ambiguities
**Action Items**:
- Decide on subscription cancellation logic (month-end vs pro-rata)
- Confirm Set-up Box ID uniqueness/reassignment rules
- Define employee role permissions
- List all predefined Areas
- Decide export format (CSV, Excel, both?)
- Confirm payment due date calculation

#### Day 3: Database Schema Design
**Deliverables**:
- ER (Entity-Relationship) Diagram
- Table definitions with constraints
- Index strategy

**Core Tables**:
- `users` (Admin, Employee)
- `customers`
- `subscriptions`
- `payments`
- `areas`
- `audit_logs`

#### Day 4-5: Setup Development Environment
**Install**:
- JDK 17+ (`java -version`)
- PostgreSQL 14+ with pgAdmin
- Maven 3.8+
- Git
- IntelliJ IDEA Community Edition
- Postman

#### Day 6-7: Project Initialization
**Actions**:
- Create Spring Boot project using Spring Initializr
- Configure application.properties (DB connection, timezone)
- Create Git repository
- Set up basic folder structure

---

### Week 2: Project Setup & API Design

#### Step 1: Spring Boot Configuration
- Database connection pooling
- JPA/Hibernate configuration
- Timezone settings (IST)
- Security configuration skeleton

#### Step 2: API Endpoint Documentation
**Document in Swagger/OpenAPI format**:

```
Authentication:
  POST   /api/auth/login              → Login (Admin/Employee/Customer)
  POST   /api/auth/logout             → Logout
  POST   /api/auth/refresh-token      → Refresh JWT token

Customer Management:
  POST   /api/customers               → Add new customer
  GET    /api/customers/{id}          → Get customer details
  PUT    /api/customers/{id}          → Update customer
  DELETE /api/customers/{id}          → Delete customer
  GET    /api/customers               → List all customers (with filters)

Subscription Management:
  POST   /api/subscriptions           → Create new subscription
  GET    /api/subscriptions/{id}      → Get subscription details
  PUT    /api/subscriptions/{id}      → Update subscription
  DELETE /api/subscriptions/{id}      → Cancel subscription

Payment Management:
  GET    /api/payments/{customerId}   → Get customer payments
  POST   /api/payments                → Record payment
  GET    /api/payments/pending        → Get pending payments list

Reporting & Export:
  GET    /api/reports/customers/export    → Export customers (CSV/Excel)
  GET    /api/reports/payments/export     → Export payments
  GET    /api/reports/pending-payments    → Get pending payments report

System:
  GET    /api/health                  → Health check
  GET    /api/areas                   → Get all areas
```

#### Step 3: Create Entity Classes
Start with:
- User (Admin/Employee)
- Customer
- Subscription
- Payment
- Area

---

### Weeks 3-4: Core Backend Development

#### Priority Order:
1. **User Authentication** (Foundation)
2. **Customer CRUD** (Basic operations)
3. **Subscription Logic** (Core business)
4. **Payment Tracking** (Critical feature)
5. **Reporting** (Export functionality)

---

## Phase Breakdown

### Phase 0: Pre-Development (Week 1)
**Focus**: Planning & Preparation

- [ ] Clarify all ambiguous requirements
- [ ] Design complete database schema
- [ ] Create ER diagram
- [ ] Set up development environment
- [ ] Initialize Spring Boot project
- [ ] Create Git repository

**Deliverables**:
- Requirements clarification document
- Database schema SQL
- API endpoint specification

---

### Phase 1: Authentication & User Management (Weeks 2-3)
**Focus**: Security foundation

- [ ] Create User entity (Admin, Employee, Customer)
- [ ] Implement bcrypt password hashing
- [ ] Implement JWT token generation
- [ ] Implement login API
- [ ] Implement logout API
- [ ] Implement token refresh API
- [ ] Create Role-Based Access Control (RBAC)
- [ ] Implement authentication middleware

**Testing**:
- Test login with valid credentials
- Test login with invalid credentials
- Test JWT token expiration
- Test token refresh

---

### Phase 2: Customer Management (Weeks 3-4)
**Focus**: Core data operations

- [ ] Create Customer entity
- [ ] Implement Add Customer API
- [ ] Implement Update Customer API
- [ ] Implement Get Customer API
- [ ] Implement List Customers API (with filters)
- [ ] Implement Delete Customer API (if needed)
- [ ] Add input validation
- [ ] Add customer search/filter functionality

**Testing**:
- CRUD operations for all fields
- Validation for mandatory fields
- Duplicate phone/email handling
- Area dropdown functionality

---

### Phase 3: Subscription Management (Weeks 4-5)
**Focus**: Core business logic

- [ ] Create Subscription entity
- [ ] Implement New Customer subscription logic (pro-rata billing)
- [ ] Implement Existing Customer subscription logic
- [ ] Implement Subscription Renewal
- [ ] Implement Subscription Cancellation
- [ ] Add business logic for billing calculations
- [ ] Implement subscription status tracking

**Business Logic**:
- New customer: Bill from subscription date to month-end
- Existing customer: Bill from 1st to month-end
- Cancellation: (Based on clarification: month-end or pro-rata)

**Testing**:
- Test all subscription scenarios
- Test billing calculations
- Test edge cases (mid-month signup, cancellation)

---

### Phase 4: Payment Management (Weeks 5-6)
**Focus**: Financial tracking

- [ ] Create Payment entity
- [ ] Implement Payment Recording API
- [ ] Implement Payment History API
- [ ] Implement Pending Payment List API
- [ ] Implement Payment Status Tracking
- [ ] Add payment due date calculations
- [ ] Implement area-wise payment filtering
- [ ] Implement date-wise payment filtering

**Features**:
- Track last payment amount and date
- Track current payment amount and date
- Calculate payment due dates
- Mark payments as pending/paid

---

### Phase 5: Reporting & Export (Weeks 6-7)
**Focus**: Data extraction

- [ ] Implement Customer List Export (CSV/Excel)
- [ ] Implement Payment List Export
- [ ] Implement Pending Payment Export
- [ ] Add area-wise filtering to exports
- [ ] Add date-range filtering (last 5 years)
- [ ] Generate reports in required formats

**Export Capabilities**:
- Export by area
- Export by date range
- Export by year/month
- Include all relevant fields

---

### Phase 6: Frontend Development (Weeks 7-8)
**Focus**: User interface

**Pages to Build**:
- [ ] Login page (Admin/Employee/Customer)
- [ ] Dashboard (role-specific)
- [ ] Customer Management page
- [ ] Subscription Management page
- [ ] Payment Tracking page
- [ ] Reports & Export page
- [ ] Settings page (for admins)

**UI Requirements**:
- Simple, clean design
- Responsive (desktop + tablet)
- IST timezone display
- Status indicators

---

### Phase 7: Security Hardening (Week 8)
**Focus**: Protection

- [ ] Implement HTTPS with Let's Encrypt
- [ ] Add SQL injection prevention
- [ ] Add CSRF protection
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Add audit logging
- [ ] Perform security review
- [ ] Set up firewall rules

---

### Phase 8: DevOps & Automation (Week 9)
**Focus**: Operations

- [ ] Implement database backup script
- [ ] Schedule backups for 3 AM IST
- [ ] Set up systemd service for Spring Boot
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Implement health monitoring
- [ ] Create deployment documentation
- [ ] Set up logging system

---

### Phase 9: Testing & Deployment (Weeks 9-10)
**Focus**: Quality & Launch

- [ ] Unit testing (JUnit, Mockito)
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing
- [ ] User acceptance testing (UAT)
- [ ] Deploy to laptop server
- [ ] Monitor for 2 weeks

---

### Phase 10: Documentation & Training (Week 10)
**Focus**: Maintenance readiness

- [ ] Create developer documentation
- [ ] Create user documentation
- [ ] Create admin/maintenance guide
- [ ] Create troubleshooting guide
- [ ] Create deployment guide
- [ ] Train on system operations

---

## Development Tools

### Essential Tools

| Tool | Purpose | Cost | Installation |
|------|---------|------|--------------|
| **JDK 17+** | Java runtime | Free | brew install openjdk@17 |
| **PostgreSQL** | Database | Free | brew install postgresql |
| **pgAdmin** | DB management | Free | Web-based access |
| **Maven** | Build tool | Free | brew install maven |
| **Git** | Version control | Free | brew install git |
| **IntelliJ IDEA CE** | IDE | Free | Download from JetBrains |
| **Postman** | API testing | Free | Desktop app |
| **VS Code** | Frontend editor | Free | brew install visual-studio-code |
| **Nginx** | Reverse proxy | Free | brew install nginx |
| **Let's Encrypt** | SSL certificates | Free | certbot (automated) |

### Optional but Recommended

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization (easier deployment) |
| **GitHub** | Code repository (private repo free) |
| **Swagger Editor** | API documentation |
| **DBeaver** | Advanced DB client |

---

## Critical Success Factors

### ✅ Do's
- ✅ **Document everything** as you build
- ✅ **Test incrementally** (don't build all then test)
- ✅ **Use version control** (Git) from day 1
- ✅ **Keep commits small** and descriptive
- ✅ **Build security in from the start** (don't add later)
- ✅ **Use meaningful variable/method names**
- ✅ **Write comments for complex logic**
- ✅ **Set up backups early**
- ✅ **Monitor system health**
- ✅ **Test edge cases** thoroughly

### ❌ Don'ts
- ❌ Don't skip authentication implementation
- ❌ Don't hardcode secrets/credentials
- ❌ Don't ignore timezone handling
- ❌ Don't use weak password hashing
- ❌ Don't skip input validation
- ❌ Don't forget error handling
- ❌ Don't deploy without HTTPS
- ❌ Don't neglect database backups
- ❌ Don't make large commits
- ❌ Don't ignore monitoring/logging

---

## Ambiguities to Clarify

### Before starting development, get answers to:

1. **Subscription Cancellation Logic** ⚠️ CRITICAL
    - Question: On cancellation, should you:
        - A) Keep running until month-end (simpler)
        - B) Pro-rate amount until cancellation date (complex)
    - Impact: Affects payment calculation logic

2. **Set-up Box ID** ⚠️ IMPORTANT
    - Question: Is Set-up Box ID unique and permanent per customer?
    - Question: Can it be reassigned to another customer?
    - Impact: Affects database constraints and uniqueness rules

3. **Employee Role Permissions** ⚠️ IMPORTANT
    - Question: What can employees do vs admins?
    - Options: View-only, Edit customers, Can't touch payments?
    - Impact: Affects role-based access control

4. **Area Dropdown List** ⚠️ CRITICAL
    - Question: What are all predefined areas?
    - Example: "Chennai-Anna Nagar", "Chennai-Velachery", etc.
    - Impact: Affects database seeding and filtering

5. **Export Format** ⚠️ MODERATE
    - Question: CSV, Excel (.xlsx), or both?
    - Question: What are exact fields to export?
    - Impact: Affects export module design

6. **Payment Due Date Calculation** ⚠️ MODERATE
    - Question: Is it always the last day of the month?
    - Question: Or a fixed day (e.g., 15th)?
    - Impact: Affects payment calculation logic

7. **Customer Self-Registration** ⚠️ MODERATE
    - Question: Can customers sign up themselves or only through admin?
    - Impact: Affects authentication workflow

8. **Payment Methods** ⚠️ MODERATE
    - Question: Is UPI the only payment method or will there be others?
    - Question: Is this just for tracking or actual integration?
    - Impact: Affects payment recording module

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│  (Admin/Employee/Customer accessing from anywhere)          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                       │
│  (Laptop, manages SSL, load balancing, compression)         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (local)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ REST Controllers (API endpoints)                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Services (Business logic)                           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Repositories (Data access)                          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Security Layer (Authentication, Authorization)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ users | customers | subscriptions | payments | ...  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKUP & MONITORING                            │
│  • Daily snapshots @ 3 AM IST                              │
│  • Health checks & alerts                                  │
│  • Log files for debugging                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

### Immediate Actions (This Week)
1. [ ] Read and understand all requirements again
2. [ ] Clarify the 8 ambiguities listed above
3. [ ] Install development environment
4. [ ] Create database schema on paper
5. [ ] Initialize Spring Boot project
6. [ ] Create Git repository
7. [ ] Set up basic folder structure

### First Month Goals
1. [ ] Complete authentication system
2. [ ] Complete customer management CRUD
3. [ ] Implement subscription logic
4. [ ] Implement payment tracking
5. [ ] Begin frontend development
6. [ ] Deploy to laptop (basic setup)

### Success Metrics
- ✅ System accessible globally via HTTPS
- ✅ All API endpoints functional and tested
- ✅ Database backups running automatically
- ✅ Zero security vulnerabilities in initial scan
- ✅ UI simple and usable
- ✅ System runs 24/7 for 2 weeks without issues

---

## Resources & References

### Documentation
- Spring Boot: https://spring.io/projects/spring-boot
- PostgreSQL: https://www.postgresql.org/docs/
- JWT in Java: https://jwt.io/
- Spring Security: https://spring.io/projects/spring-security

### Tools Documentation
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- Git: https://git-scm.com/doc
- Maven: https://maven.apache.org/guides/

### Security Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- bcrypt: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## Contact & Support

**Project Owner**: Dad's Cable TV Business  
**Development Lead**: [Your Name]  
**Last Updated**: April 18, 2026  
**Status**: Planning Phase ✏️

---

**Remember**: Start small, test thoroughly, iterate quickly, and keep the system simple. This approach will make it easy to maintain and extend in the future.

---

*This document is a living document and should be updated as the project progresses.*

