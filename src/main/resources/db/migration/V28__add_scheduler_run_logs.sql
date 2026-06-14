CREATE TABLE scheduler_run_logs (
    id               BIGSERIAL PRIMARY KEY,
    run_date         DATE           NOT NULL,
    run_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    triggered_by     VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    grace_count      INT            NOT NULL DEFAULT 0,
    pending_count    INT            NOT NULL DEFAULT 0,
    deactivated_count INT           NOT NULL DEFAULT 0
);

CREATE INDEX idx_scheduler_run_logs_run_at ON scheduler_run_logs (run_at DESC);
