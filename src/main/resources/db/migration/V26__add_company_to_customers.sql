-- Pin each customer to a single company. Previously a customer's company was
-- only implicit (customer→area→city, where a city can be served by many
-- companies), which left ownership ambiguous in multi-company deployments.

ALTER TABLE customers
    ADD COLUMN company_id BIGINT REFERENCES companies(company_id);

-- Backfill: pick a company that serves the customer's city.
UPDATE customers c
SET company_id = sub.company_id
FROM (
    SELECT a.area_id, MIN(cc.company_id) AS company_id
    FROM areas a
    JOIN company_cities cc ON cc.city_id = a.city_id
    GROUP BY a.area_id
) sub
WHERE c.area_id = sub.area_id;

-- Fallback for any customer whose city is not linked to a company yet:
-- assign the lowest company id (deployments without any company will fail the
-- NOT NULL set below, which is intentional — seed a company first).
UPDATE customers
SET company_id = (SELECT MIN(company_id) FROM companies)
WHERE company_id IS NULL;

ALTER TABLE customers
    ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX idx_customers_company_id ON customers(company_id);
