-- Company now belongs to a City (many companies per city)
ALTER TABLE companies ADD COLUMN city_id BIGINT REFERENCES cities(city_id);

-- Remove old FK from cities
DROP INDEX IF EXISTS idx_cities_company_id;
ALTER TABLE cities DROP COLUMN company_id;

-- Remove redundant city_id from employee_groups (city is implicit via company)
ALTER TABLE employee_groups
    DROP CONSTRAINT employee_groups_company_id_city_id_group_name_key;
ALTER TABLE employee_groups DROP COLUMN city_id;
ALTER TABLE employee_groups
    ADD CONSTRAINT employee_groups_company_id_group_name_key UNIQUE (company_id, group_name);
