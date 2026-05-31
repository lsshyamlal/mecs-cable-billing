-- "groups" is a reserved word in PostgreSQL; table is named employee_groups
CREATE TABLE employee_groups (
    group_id   BIGSERIAL PRIMARY KEY,
    company_id BIGINT       NOT NULL REFERENCES companies(company_id),
    city_id    BIGINT       NOT NULL REFERENCES cities(city_id),
    group_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, city_id, group_name)
);

CREATE INDEX idx_employee_groups_company_id ON employee_groups(company_id);
CREATE INDEX idx_employee_groups_city_id    ON employee_groups(city_id);
