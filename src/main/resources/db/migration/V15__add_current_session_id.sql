ALTER TABLE admins
    ADD COLUMN current_session_id VARCHAR(64);

ALTER TABLE customers
    ADD COLUMN current_session_id VARCHAR(64);
