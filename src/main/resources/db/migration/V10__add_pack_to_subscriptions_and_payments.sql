ALTER TABLE subscriptions
    ADD COLUMN pack_id BIGINT REFERENCES subscription_packs(pack_id);

ALTER TABLE payments
    ADD COLUMN pack_id             BIGINT  REFERENCES subscription_packs(pack_id),
    ADD COLUMN is_manual_override  BOOLEAN NOT NULL DEFAULT FALSE;
