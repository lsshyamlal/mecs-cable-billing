CREATE TABLE employees (
    employee_id        BIGSERIAL    PRIMARY KEY,
    group_id           BIGINT       NOT NULL REFERENCES employee_groups(group_id),
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100),
    phone              VARCHAR(20)  NOT NULL UNIQUE,
    email              VARCHAR(255),
    password_hash      VARCHAR(255) NOT NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    current_session_id VARCHAR(255),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at      TIMESTAMPTZ
);

CREATE INDEX idx_employees_group_id ON employees(group_id);
