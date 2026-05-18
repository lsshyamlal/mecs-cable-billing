-- Customers need a portal login password set by the admin
ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255);
