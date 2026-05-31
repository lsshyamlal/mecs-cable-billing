ALTER TABLE subscriptions
    ADD COLUMN deactivation_date         DATE,
    ADD COLUMN deactivation_notes        TEXT,
    ADD COLUMN deactivated_by            BIGINT REFERENCES admins(admin_id),
    ADD COLUMN deactivation_recorded_at  TIMESTAMPTZ;

CREATE INDEX idx_subscriptions_deactivation_date
    ON subscriptions(deactivation_date)
    WHERE deactivation_date IS NOT NULL;
