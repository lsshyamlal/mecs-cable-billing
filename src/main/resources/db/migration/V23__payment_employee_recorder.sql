-- Allow payments to be recorded by employees (not just admins).
-- Exactly one of recorded_by / recorded_by_employee must be set (enforced at application layer).
ALTER TABLE payments
    ALTER COLUMN recorded_by DROP NOT NULL,
    ADD COLUMN recorded_by_employee BIGINT REFERENCES employees(employee_id);
