-- Add per-area grace period day (day of the month following subscription end by which payment is due)
ALTER TABLE areas ADD COLUMN grace_period_day SMALLINT NOT NULL DEFAULT 5;
ALTER TABLE areas ADD CONSTRAINT chk_grace_period_day CHECK (grace_period_day BETWEEN 1 AND 28);
