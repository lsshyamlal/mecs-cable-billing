DROP INDEX IF EXISTS idx_customers_is_payment_pending;
ALTER TABLE customers DROP COLUMN IF EXISTS is_payment_pending;
