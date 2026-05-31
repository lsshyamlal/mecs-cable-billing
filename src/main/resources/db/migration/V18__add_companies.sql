CREATE TABLE companies (
    company_id   BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL UNIQUE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
