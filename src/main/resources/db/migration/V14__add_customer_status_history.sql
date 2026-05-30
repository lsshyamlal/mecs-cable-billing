CREATE TABLE customer_status_history (
    history_id   BIGSERIAL PRIMARY KEY,
    customer_id  BIGINT NOT NULL REFERENCES customers(customer_id),
    from_status  customer_status,
    to_status    customer_status NOT NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by   BIGINT REFERENCES admins(admin_id),
    notes        TEXT
);

CREATE INDEX idx_csh_customer_id ON customer_status_history(customer_id);
