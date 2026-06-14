-- Replace company.city_id (ManyToOne) with a many-to-many join table
CREATE TABLE company_cities (
    company_id BIGINT NOT NULL REFERENCES companies(company_id),
    city_id    BIGINT NOT NULL REFERENCES cities(city_id),
    PRIMARY KEY (company_id, city_id)
);

-- Preserve any existing company→city links before dropping the column
INSERT INTO company_cities (company_id, city_id)
SELECT company_id, city_id FROM companies WHERE city_id IS NOT NULL;

ALTER TABLE companies DROP COLUMN city_id;

-- Restore city_id on employee_groups (removed in V24, needed for company+city scope)
ALTER TABLE employee_groups ADD COLUMN city_id BIGINT REFERENCES cities(city_id);

-- Restore the original unique constraint
ALTER TABLE employee_groups
    DROP CONSTRAINT IF EXISTS employee_groups_company_id_group_name_key;
ALTER TABLE employee_groups
    ADD CONSTRAINT employee_groups_company_id_city_id_group_name_key
    UNIQUE (company_id, city_id, group_name);
