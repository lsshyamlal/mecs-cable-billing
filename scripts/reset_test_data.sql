-- =============================================================
-- MECS Cable Billing — Test Data Reset
-- Reference date: 2026-05-18
--
-- Admin login:    admin@mecs.com  /  admin123
-- Customer login: <phone>         /  Test@1234
--
-- Areas:
--   North Town — grace_period_day = 25 (pay by 25th of next month)
--   South Town — grace_period_day = 10 (pay by 10th of next month)
--
-- Scenarios:
--   1. Arjun Sharma  — North Town — May subscription PAID
--   2. Priya Nair    — South Town — May subscription ACTIVE (not yet paid)
--   3. Ravi Kumar    — North Town — Apr subscription GRACE
--                       (deadline May 25, today May 18 → still in window)
--   4. Meera Pillai  — South Town — Apr subscription PAYMENT_PENDING
--                       (deadline May 10, today May 18 → window closed)
--   5. Suresh Menon  — South Town — SUSPENDED (never paid Mar, account suspended)
-- =============================================================

-- ---------------------------------------------------------------
-- Clear all data and restart identity sequences
-- ---------------------------------------------------------------
TRUNCATE payments, subscriptions, audit_logs, customers, admins, areas
    RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------
-- Areas
-- ---------------------------------------------------------------
INSERT INTO areas (area_name, grace_period_day) VALUES
    ('North Town', 25),
    ('South Town', 10);
-- area_id: North Town = 1, South Town = 2

-- ---------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------
INSERT INTO admins (first_name, last_name, email, phone, password_hash, is_active) VALUES
    ('Super', 'Admin', 'admin@mecs.com', '9000000000',
     '$2b$10$/xQsfbYQZruEZ/5BBvaWZOu/OkYP9JGFwHT/Ah5yQjXlUl8oTrgt.', TRUE);
-- admin_id = 1

-- ---------------------------------------------------------------
-- Customers
-- BCrypt hash of "Test@1234" (Spring BCrypt-compatible):
--   $2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m
-- ---------------------------------------------------------------

-- 1. Arjun Sharma — North Town (grace day 25)
--    May subscription paid on 2026-05-05; next due Jun 25
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Arjun', 'Sharma', '12', 'MG Road', 1,
    '9876543001', 'arjun.sharma@example.com', 'arjun@upi', 'STB-001',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    300.00, '2026-05-05',
    300.00, '2026-05-05',
    '2026-06-25', FALSE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 1

-- 2. Priya Nair — South Town (grace day 10)
--    May subscription running; last paid Apr; next due Jun 10
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Priya', 'Nair', '45', 'Gandhi Street', 2,
    '9876543002', 'priya.nair@example.com', 'priya@upi', 'STB-002',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    280.00, '2026-04-08',
    280.00, NULL,
    '2026-06-10', FALSE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 2

-- 3. Ravi Kumar — North Town (grace day 25)
--    Apr subscription ended; grace deadline May 25; today May 18 → GRACE
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Ravi', 'Kumar', '7', 'Lake View Road', 1,
    '9876543003', 'ravi.kumar@example.com', 'ravi@upi', 'STB-003',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    350.00, '2026-03-03',
    350.00, NULL,
    '2026-05-25', FALSE,
    '2026-04-01', '2026-04-30'
);
-- customer_id = 3

-- 4. Meera Pillai — South Town (grace day 10)
--    Apr subscription ended; grace deadline May 10; today May 18 → PAYMENT_PENDING
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Meera', 'Pillai', '23', 'Temple Street', 2,
    '9876543004', 'meera.pillai@example.com', 'meera@upi', 'STB-004',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    320.00, '2026-03-07',
    320.00, NULL,
    '2026-05-10', TRUE,
    '2026-04-01', '2026-04-30'
);
-- customer_id = 4

-- 5. Suresh Menon — South Town (grace day 10)
--    Never paid March; account suspended
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Suresh', 'Menon', '88', 'Park Avenue', 2,
    '9876543005', 'suresh.menon@example.com', 'suresh@upi', 'STB-005',
    'SUSPENDED', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    290.00, '2026-02-06',
    290.00, NULL,
    NULL, FALSE,
    '2026-03-01', '2026-03-31'
);
-- customer_id = 5

-- ---------------------------------------------------------------
-- Subscriptions
-- (RESTART IDENTITY means subscription_id starts at 1)
-- ---------------------------------------------------------------

-- Arjun Sharma: Feb–May, all PAID
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (1, 300.00, '2026-02-01', '2026-02-28', 'PAID', 1),   -- sub_id = 1
    (1, 300.00, '2026-03-01', '2026-03-31', 'PAID', 1),   -- sub_id = 2
    (1, 300.00, '2026-04-01', '2026-04-30', 'PAID', 1),   -- sub_id = 3
    (1, 300.00, '2026-05-01', '2026-05-31', 'PAID', 1);   -- sub_id = 4

-- Priya Nair: Mar–Apr PAID, May ACTIVE
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (2, 280.00, '2026-03-01', '2026-03-31', 'PAID',   1),  -- sub_id = 5
    (2, 280.00, '2026-04-01', '2026-04-30', 'PAID',   1),  -- sub_id = 6
    (2, 280.00, '2026-05-01', '2026-05-31', 'ACTIVE', 1);  -- sub_id = 7

-- Ravi Kumar: Feb–Mar PAID, Apr GRACE
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (3, 350.00, '2026-02-01', '2026-02-28', 'PAID',  1),   -- sub_id = 8
    (3, 350.00, '2026-03-01', '2026-03-31', 'PAID',  1),   -- sub_id = 9
    (3, 350.00, '2026-04-01', '2026-04-30', 'GRACE', 1);   -- sub_id = 10

-- Meera Pillai: Feb–Mar PAID, Apr PAYMENT_PENDING
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (4, 320.00, '2026-02-01', '2026-02-28', 'PAID',            1),  -- sub_id = 11
    (4, 320.00, '2026-03-01', '2026-03-31', 'PAID',            1),  -- sub_id = 12
    (4, 320.00, '2026-04-01', '2026-04-30', 'PAYMENT_PENDING', 1);  -- sub_id = 13

-- Suresh Menon: Jan–Feb PAID, Mar SUSPENDED
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (5, 290.00, '2026-01-01', '2026-01-31', 'PAID',      1),  -- sub_id = 14
    (5, 290.00, '2026-02-01', '2026-02-28', 'PAID',      1),  -- sub_id = 15
    (5, 290.00, '2026-03-01', '2026-03-31', 'SUSPENDED', 1);  -- sub_id = 16

-- ---------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------

-- Arjun Sharma — paid Feb, Mar, Apr, May
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (1, 1,  300.00, '2026-02-07', 'UPI',  1),
    (1, 2,  300.00, '2026-03-04', 'UPI',  1),
    (1, 3,  300.00, '2026-04-06', 'UPI',  1),
    (1, 4,  300.00, '2026-05-05', 'UPI',  1);

-- Priya Nair — paid Mar, Apr; May not yet paid
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (2, 5,  280.00, '2026-03-09', 'CASH', 1),
    (2, 6,  280.00, '2026-04-08', 'CASH', 1);

-- Ravi Kumar — paid Feb, Mar; Apr unpaid (GRACE)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (3, 8,  350.00, '2026-02-10', 'UPI',  1),
    (3, 9,  350.00, '2026-03-03', 'UPI',  1);

-- Meera Pillai — paid Feb, Mar; Apr unpaid (PAYMENT_PENDING)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (4, 11, 320.00, '2026-02-09', 'ONLINE', 1),
    (4, 12, 320.00, '2026-03-07', 'ONLINE', 1);

-- Suresh Menon — paid Jan, Feb; Mar unpaid (SUSPENDED)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (5, 14, 290.00, '2026-01-09', 'CASH', 1),
    (5, 15, 290.00, '2026-02-06', 'CASH', 1);

-- ---------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------
SELECT
    c.first_name || ' ' || c.last_name                  AS customer,
    a.area_name || ' (grace day ' || a.grace_period_day || ')'  AS area,
    c.status                                             AS account_status,
    s.status                                             AS subscription_status,
    s.start_date, s.end_date
FROM customers c
JOIN areas a ON a.area_id = c.area_id
LEFT JOIN subscriptions s ON s.customer_id = c.customer_id
    AND s.end_date = c.current_subscription_end
ORDER BY c.customer_id;
