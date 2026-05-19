-- Upgrade payment_date from DATE to TIMESTAMPTZ so the exact moment of
-- payment can be recorded. Existing rows are migrated as midnight IST on
-- the recorded date (Asia/Kolkata = UTC+05:30).
ALTER TABLE payments
    ALTER COLUMN payment_date TYPE TIMESTAMPTZ
    USING payment_date::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
