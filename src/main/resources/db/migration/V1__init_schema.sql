-- ============================================================
-- V1: Initial schema for MECS Cable TV Billing Software
-- All timestamps stored in UTC; displayed in IST at app layer
-- ============================================================

-- ---------------------------------------------------------------
-- ADMINS
-- ---------------------------------------------------------------
CREATE TABLE admins (
    admin_id      BIGSERIAL    PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100),
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------
-- AREAS
-- ---------------------------------------------------------------
CREATE TABLE areas (
    area_id    BIGSERIAL    PRIMARY KEY,
    area_name  VARCHAR(200) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE customers (
    customer_id              BIGSERIAL       PRIMARY KEY,
    first_name               VARCHAR(100)    NOT NULL,
    last_name                VARCHAR(100),
    door_number              VARCHAR(50),
    street_name              VARCHAR(200),
    area_id                  BIGINT          NOT NULL REFERENCES areas(area_id),
    phone                    VARCHAR(20)     NOT NULL,
    email                    VARCHAR(255),
    upi_id                   VARCHAR(100),
    stb_id                   VARCHAR(100),
    account_created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    status                   customer_status NOT NULL DEFAULT 'ACTIVE',
    last_payment_amount      DECIMAL(10,2),
    last_payment_date        DATE,
    current_payment_amount   DECIMAL(10,2),
    current_payment_date     DATE,
    current_payment_due_date DATE,
    is_payment_pending       BOOLEAN         NOT NULL DEFAULT FALSE,
    current_subscription_start DATE,
    current_subscription_end   DATE,
    updated_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- STB ID unique only among ACTIVE customers
CREATE UNIQUE INDEX uq_stb_active
    ON customers(stb_id)
    WHERE status = 'ACTIVE' AND stb_id IS NOT NULL;

CREATE INDEX idx_customers_status           ON customers(status);
CREATE INDEX idx_customers_area_id          ON customers(area_id);
CREATE INDEX idx_customers_is_payment_pending ON customers(is_payment_pending);

-- ---------------------------------------------------------------
-- SUBSCRIPTIONS
-- ---------------------------------------------------------------
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'GRACE',
    'PAYMENT_PENDING',
    'PAID',
    'SUSPENDED',
    'CANCELLED'
);

CREATE TABLE subscriptions (
    subscription_id BIGSERIAL           PRIMARY KEY,
    customer_id     BIGINT              NOT NULL REFERENCES customers(customer_id),
    monthly_rate    DECIMAL(10,2)       NOT NULL,
    start_date      DATE                NOT NULL,
    end_date        DATE                NOT NULL,
    status          subscription_status NOT NULL,
    enrolled_by     BIGINT              REFERENCES admins(admin_id),
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    notes           TEXT
);

CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status      ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date    ON subscriptions(end_date);

-- ---------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------
CREATE TABLE payments (
    payment_id     BIGSERIAL     PRIMARY KEY,
    customer_id    BIGINT        NOT NULL REFERENCES customers(customer_id),
    subscription_id BIGINT       REFERENCES subscriptions(subscription_id),
    amount         DECIMAL(10,2) NOT NULL,
    payment_date   DATE          NOT NULL,
    payment_method VARCHAR(50),
    recorded_by    BIGINT        NOT NULL REFERENCES admins(admin_id),
    notes          TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_customer_id  ON payments(customer_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- ---------------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id      BIGSERIAL    PRIMARY KEY,
    actor_id    BIGINT       NOT NULL,
    actor_role  VARCHAR(50)  NOT NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   BIGINT,
    details     JSONB,
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip_address  VARCHAR(50)
);

CREATE INDEX idx_audit_logs_actor_id        ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type_id  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp       ON audit_logs(timestamp);
