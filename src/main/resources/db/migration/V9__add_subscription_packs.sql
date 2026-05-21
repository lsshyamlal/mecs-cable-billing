CREATE TABLE subscription_packs (
    pack_id      BIGSERIAL PRIMARY KEY,
    pack_name    VARCHAR(200) NOT NULL,
    monthly_rate NUMERIC(10, 2) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_subscription_packs_name UNIQUE (pack_name)
);
