-- =============================================================
-- MECS Cable Billing — Test Data Reset
-- Reference date: 2026-05-18
--
-- Admin login:    admin@mecs.com  /  admin123
-- Customer login: <phone>         /  Test@1234
--
-- Grace period rule (new):
--   Payment is due on subscription START DATE (1st of the month).
--   Each area has a grace_period_day = Nth day of the START MONTH
--   by which payment must be received before becoming PAYMENT_PENDING.
--
-- Areas:
--   North Town — grace_period_day = 25  (pay by May 25 for a May subscription)
--   South Town — grace_period_day = 10  (pay by May 10 for a May subscription)
--
-- Scenarios (all subscription periods are the current month, May 2026):
--   1. Arjun Sharma  — North Town — May PAID
--                       paid May 5, before deadline May 25
--   2. Priya Nair    — North Town — May GRACE
--                       not yet paid; deadline May 25; today May 18 → within window
--   3. Ravi Kumar    — South Town — May PAYMENT_PENDING
--                       not paid; deadline May 10; today May 18 → window closed
--   4. Meera Pillai  — South Town — May PAID
--                       paid May 7, before deadline May 10
--   5. Suresh Menon  — South Town — SUSPENDED 2026-04-10 (6 weeks ago)
--                       suspended_at + 2 years = 2028-04-10 → PORTAL LOGIN ALLOWED
--   6. Kavita Rao    — North Town — SUSPENDED 2024-05-17 (2 years + 1 day ago)
--                       suspended_at + 2 years = 2026-05-17 < today → PORTAL LOGIN BLOCKED
--   7. Deepak Iyer   — South Town — SUSPENDED 2024-06-18 (≈ 23 months ago)
--                       suspended_at + 2 years = 2026-06-18 > today → PORTAL LOGIN ALLOWED
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
    ('North Town', 25),   -- area_id = 1: pay by 25th of subscription start month
    ('South Town', 10);   -- area_id = 2: pay by 10th of subscription start month

-- ---------------------------------------------------------------
-- Admin
-- BCrypt hash of "admin123"
-- ---------------------------------------------------------------
INSERT INTO admins (first_name, last_name, email, phone, password_hash, is_active) VALUES
    ('Super', 'Admin', 'admin@mecs.com', '9000000000',
     '$2b$10$/xQsfbYQZruEZ/5BBvaWZOu/OkYP9JGFwHT/Ah5yQjXlUl8oTrgt.', TRUE);
-- admin_id = 1

-- ---------------------------------------------------------------
-- Customers
-- BCrypt hash of "Test@1234":
--   $2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m
-- ---------------------------------------------------------------

-- 1. Arjun Sharma — North Town (grace day 25)
--    May subscription: started May 1 → GRACE on May 1; paid May 5 → PAID
--    Next due: Jun 25 (Jun subscription grace deadline)
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
    300.00, '2026-04-06',
    300.00, '2026-05-05',
    '2026-06-25', FALSE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 1

-- 2. Priya Nair — North Town (grace day 25)
--    May subscription: started May 1 → GRACE on May 1; not paid yet
--    Grace deadline May 25; today May 18 → still within window
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Priya', 'Nair', '45', 'Gandhi Street', 1,
    '9876543002', 'priya.nair@example.com', 'priya@upi', 'STB-002',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    280.00, '2026-04-15',
    280.00, NULL,
    '2026-05-25', FALSE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 2

-- 3. Ravi Kumar — South Town (grace day 10)
--    May subscription: started May 1 → GRACE on May 1; not paid
--    Grace deadline May 10; May 11 → PAYMENT_PENDING; today May 18 → service suspended
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Ravi', 'Kumar', '7', 'Lake View Road', 2,
    '9876543003', 'ravi.kumar@example.com', 'ravi@upi', 'STB-003',
    'ACTIVE', '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    350.00, '2026-04-08',
    350.00, NULL,
    '2026-05-10', TRUE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 3

-- 4. Meera Pillai — South Town (grace day 10)
--    May subscription: started May 1 → GRACE on May 1; paid May 7 → PAID (before May 10 deadline)
--    Next due: Jun 10
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
    320.00, '2026-04-07',
    320.00, '2026-05-07',
    '2026-06-10', FALSE,
    '2026-05-01', '2026-05-31'
);
-- customer_id = 4

-- 5. Suresh Menon — South Town (grace day 10)
--    Never paid Mar; suspended 2026-04-10 → 2yr window expires 2028-04-10 → LOGIN ALLOWED
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, suspended_at, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Suresh', 'Menon', '88', 'Park Avenue', 2,
    '9876543005', 'suresh.menon@example.com', 'suresh@upi', 'STB-005',
    'SUSPENDED', '2026-04-10 00:00:00+05:30',
    '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    290.00, '2026-02-06',
    290.00, NULL,
    NULL, FALSE,
    '2026-03-01', '2026-03-31'
);
-- customer_id = 5

-- ---------------------------------------------------------------
-- Subscriptions for customers 1–5
-- ---------------------------------------------------------------

-- Arjun Sharma: Feb–Apr PAID, May PAID (paid May 5 before May 25 grace deadline)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (1, 300.00, '2026-02-01', '2026-02-28', 'PAID', 1),   -- sub_id = 1
    (1, 300.00, '2026-03-01', '2026-03-31', 'PAID', 1),   -- sub_id = 2
    (1, 300.00, '2026-04-01', '2026-04-30', 'PAID', 1),   -- sub_id = 3
    (1, 300.00, '2026-05-01', '2026-05-31', 'PAID', 1);   -- sub_id = 4

-- Priya Nair: Mar–Apr PAID, May GRACE (deadline May 25, today May 18 → in window)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (2, 280.00, '2026-03-01', '2026-03-31', 'PAID',  1),  -- sub_id = 5
    (2, 280.00, '2026-04-01', '2026-04-30', 'PAID',  1),  -- sub_id = 6
    (2, 280.00, '2026-05-01', '2026-05-31', 'GRACE', 1);  -- sub_id = 7

-- Ravi Kumar: Feb–Apr PAID, May PAYMENT_PENDING (deadline May 10, today May 18 → window closed)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (3, 350.00, '2026-02-01', '2026-02-28', 'PAID',            1),  -- sub_id = 8
    (3, 350.00, '2026-03-01', '2026-03-31', 'PAID',            1),  -- sub_id = 9
    (3, 350.00, '2026-04-01', '2026-04-30', 'PAID',            1),  -- sub_id = 10
    (3, 350.00, '2026-05-01', '2026-05-31', 'PAYMENT_PENDING', 1);  -- sub_id = 11

-- Meera Pillai: Feb–Apr PAID, May PAID (paid May 7 before May 10 grace deadline)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (4, 320.00, '2026-02-01', '2026-02-28', 'PAID', 1),   -- sub_id = 12
    (4, 320.00, '2026-03-01', '2026-03-31', 'PAID', 1),   -- sub_id = 13
    (4, 320.00, '2026-04-01', '2026-04-30', 'PAID', 1),   -- sub_id = 14
    (4, 320.00, '2026-05-01', '2026-05-31', 'PAID', 1);   -- sub_id = 15

-- Suresh Menon: Jan–Feb PAID, Mar SUSPENDED (admin suspended customer Apr 10)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (5, 290.00, '2026-01-01', '2026-01-31', 'PAID',      1),  -- sub_id = 16
    (5, 290.00, '2026-02-01', '2026-02-28', 'PAID',      1),  -- sub_id = 17
    (5, 290.00, '2026-03-01', '2026-03-31', 'SUSPENDED', 1);  -- sub_id = 18

-- ---------------------------------------------------------------
-- Payments for customers 1–5
-- ---------------------------------------------------------------

-- Arjun Sharma — paid Feb, Mar, Apr, May
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (1, 1,  300.00, '2026-02-05', 'UPI',  1),
    (1, 2,  300.00, '2026-03-04', 'UPI',  1),
    (1, 3,  300.00, '2026-04-06', 'UPI',  1),
    (1, 4,  300.00, '2026-05-05', 'UPI',  1);

-- Priya Nair — paid Mar, Apr; May not yet paid (in GRACE until May 25)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (2, 5,  280.00, '2026-03-10', 'CASH', 1),
    (2, 6,  280.00, '2026-04-15', 'CASH', 1);

-- Ravi Kumar — paid Feb, Mar, Apr; May unpaid (PAYMENT_PENDING since May 11)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (3, 8,  350.00, '2026-02-07', 'UPI', 1),
    (3, 9,  350.00, '2026-03-05', 'UPI', 1),
    (3, 10, 350.00, '2026-04-08', 'UPI', 1);

-- Meera Pillai — paid Feb, Mar, Apr, May (May paid May 7, before May 10 deadline)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (4, 12, 320.00, '2026-02-08', 'ONLINE', 1),
    (4, 13, 320.00, '2026-03-06', 'ONLINE', 1),
    (4, 14, 320.00, '2026-04-07', 'ONLINE', 1),
    (4, 15, 320.00, '2026-05-07', 'ONLINE', 1);

-- Suresh Menon — paid Jan, Feb; Mar unpaid (SUSPENDED)
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by) VALUES
    (5, 16, 290.00, '2026-01-08', 'CASH', 1),
    (5, 17, 290.00, '2026-02-06', 'CASH', 1);

-- ---------------------------------------------------------------
-- 6. Kavita Rao — North Town (grace day 25)
--    Suspended 2024-05-17 → 2yr window expired 2026-05-17 (yesterday) → LOGIN BLOCKED
-- ---------------------------------------------------------------
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, suspended_at, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Kavita', 'Rao', '5', 'Hill Road', 1,
    '9876543006', 'kavita.rao@example.com', 'kavita@upi', NULL,
    'SUSPENDED', '2024-05-17 00:00:00+05:30',
    '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    250.00, '2024-04-05',
    250.00, NULL,
    NULL, FALSE,
    '2024-04-01', '2024-04-30'
);
-- customer_id = 6

-- 7. Deepak Iyer — South Town (grace day 10)
--    Suspended 2024-06-18 → 2yr window expires 2026-06-18 (31 days away) → LOGIN ALLOWED
INSERT INTO customers (
    first_name, last_name, door_number, street_name, area_id,
    phone, email, upi_id, stb_id,
    status, suspended_at, password_hash,
    last_payment_amount, last_payment_date,
    current_payment_amount, current_payment_date,
    current_payment_due_date, is_payment_pending,
    current_subscription_start, current_subscription_end
) VALUES (
    'Deepak', 'Iyer', '67', 'River Road', 2,
    '9876543007', 'deepak.iyer@example.com', 'deepak@upi', NULL,
    'SUSPENDED', '2024-06-18 00:00:00+05:30',
    '$2b$10$aBgS5v.RSXnSDI.Wuu06Aul0MK/RP.ej/NtVEeX1ZUbSQh3UjLq4m',
    310.00, '2024-05-11',
    310.00, NULL,
    NULL, FALSE,
    '2024-05-01', '2024-05-31'
);
-- customer_id = 7

-- ---------------------------------------------------------------
-- Subscriptions for Kavita Rao (customer_id = 6)
-- ---------------------------------------------------------------
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (6, 250.00, '2024-02-01', '2024-02-29', 'PAID',      1),  -- sub_id = 19
    (6, 250.00, '2024-03-01', '2024-03-31', 'PAID',      1),  -- sub_id = 20
    (6, 250.00, '2024-04-01', '2024-04-30', 'CANCELLED', 1);  -- sub_id = 21

-- Subscriptions for Deepak Iyer (customer_id = 7)
INSERT INTO subscriptions (customer_id, monthly_rate, start_date, end_date, status, enrolled_by) VALUES
    (7, 310.00, '2024-03-01', '2024-03-31', 'PAID',      1),  -- sub_id = 22
    (7, 310.00, '2024-04-01', '2024-04-30', 'PAID',      1),  -- sub_id = 23
    (7, 310.00, '2024-05-01', '2024-05-31', 'CANCELLED', 1);  -- sub_id = 24

-- Payments for Kavita Rao
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by)
SELECT 6, subscription_id, 250.00, start_date + 5, 'CASH', 1
FROM subscriptions WHERE customer_id = 6 AND status = 'PAID';

-- Payments for Deepak Iyer
INSERT INTO payments (customer_id, subscription_id, amount, payment_date, payment_method, recorded_by)
SELECT 7, subscription_id, 310.00, start_date + 10, 'UPI', 1
FROM subscriptions WHERE customer_id = 7 AND status = 'PAID';

-- ---------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------
SELECT
    c.customer_id,
    c.first_name || ' ' || c.last_name                            AS customer,
    a.area_name || ' (grace=' || a.grace_period_day || ')'        AS area,
    c.status                                                       AS account_status,
    s.status                                                       AS sub_status,
    s.start_date,
    s.end_date,
    c.current_payment_due_date                                     AS grace_deadline,
    c.is_payment_pending,
    CASE
        WHEN c.suspended_at IS NULL                               THEN 'n/a'
        WHEN c.suspended_at + INTERVAL '2 years'
             > NOW() AT TIME ZONE 'Asia/Kolkata'                  THEN 'PORTAL ALLOWED (until ' ||
             TO_CHAR((c.suspended_at + INTERVAL '2 years')
                     AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') || ')'
        ELSE                                                           'PORTAL BLOCKED (expired ' ||
             TO_CHAR((c.suspended_at + INTERVAL '2 years')
                     AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') || ')'
    END                                                            AS portal_access
FROM customers c
JOIN areas a ON a.area_id = c.area_id
LEFT JOIN subscriptions s ON s.customer_id = c.customer_id
    AND s.start_date = c.current_subscription_start
ORDER BY c.customer_id;
