ALTER TABLE cities
    ADD COLUMN company_id BIGINT REFERENCES companies(company_id);

CREATE INDEX idx_cities_company_id ON cities(company_id);
