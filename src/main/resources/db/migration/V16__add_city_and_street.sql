-- ============================================================
-- V16: Introduce city → area → street address hierarchy
-- ============================================================
--   * cities (new, top-level)
--   * areas gains city_id FK; uniqueness scoped to (city_id, area_name)
--   * streets (new, child of area)
--   * customers.street_name (free text) → customers.street_id FK
-- ============================================================

-- ---------------------------------------------------------------
-- CITIES
-- ---------------------------------------------------------------
CREATE TABLE cities (
    city_id    BIGSERIAL    PRIMARY KEY,
    city_name  VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_city_name UNIQUE (city_name)
);

INSERT INTO cities (city_name) VALUES ('Madurai City');

-- ---------------------------------------------------------------
-- AREAS: attach to a city; rescope name uniqueness
-- ---------------------------------------------------------------
ALTER TABLE areas ADD COLUMN city_id BIGINT REFERENCES cities(city_id);

UPDATE areas
SET city_id = (SELECT city_id FROM cities WHERE city_name = 'Madurai City');

ALTER TABLE areas ALTER COLUMN city_id SET NOT NULL;

-- area_name was previously globally unique; now unique per city.
ALTER TABLE areas DROP CONSTRAINT areas_area_name_key;
ALTER TABLE areas ADD CONSTRAINT uq_area_city_name UNIQUE (city_id, area_name);

CREATE INDEX idx_areas_city_id ON areas(city_id);

-- ---------------------------------------------------------------
-- STREETS
-- ---------------------------------------------------------------
CREATE TABLE streets (
    street_id   BIGSERIAL    PRIMARY KEY,
    area_id     BIGINT       NOT NULL REFERENCES areas(area_id),
    street_name VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_street_area_name UNIQUE (area_id, street_name)
);

CREATE INDEX idx_streets_area_id ON streets(area_id);

-- ---------------------------------------------------------------
-- Backfill streets from existing customers.street_name
-- Dedup case-insensitively per area; keep the first trimmed casing seen.
-- ---------------------------------------------------------------
INSERT INTO streets (area_id, street_name)
SELECT DISTINCT ON (area_id, LOWER(TRIM(street_name)))
       area_id, TRIM(street_name)
FROM customers
WHERE street_name IS NOT NULL
  AND TRIM(street_name) <> ''
ORDER BY area_id, LOWER(TRIM(street_name)), customer_id;

-- ---------------------------------------------------------------
-- CUSTOMERS: street_name (text) → street_id (FK)
-- ---------------------------------------------------------------
ALTER TABLE customers ADD COLUMN street_id BIGINT REFERENCES streets(street_id);

UPDATE customers c
SET street_id = s.street_id
FROM streets s
WHERE s.area_id = c.area_id
  AND LOWER(s.street_name) = LOWER(TRIM(c.street_name))
  AND c.street_name IS NOT NULL
  AND TRIM(c.street_name) <> '';

ALTER TABLE customers DROP COLUMN street_name;

CREATE INDEX idx_customers_street_id ON customers(street_id);
