-- Move from a single pack per payment/subscription to multiple packs.
-- This migration introduces join tables and backfills existing single-pack
-- references. The legacy payments.pack_id and subscriptions.pack_id columns
-- are kept for now so deploys can roll back; a later V28 drops them.

CREATE TABLE payment_packs (
    payment_id BIGINT NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    pack_id    BIGINT NOT NULL REFERENCES subscription_packs(pack_id),
    PRIMARY KEY (payment_id, pack_id)
);

CREATE TABLE subscription_pack_assignments (
    subscription_id BIGINT NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
    pack_id         BIGINT NOT NULL REFERENCES subscription_packs(pack_id),
    PRIMARY KEY (subscription_id, pack_id)
);

INSERT INTO payment_packs (payment_id, pack_id)
SELECT payment_id, pack_id FROM payments WHERE pack_id IS NOT NULL;

INSERT INTO subscription_pack_assignments (subscription_id, pack_id)
SELECT subscription_id, pack_id FROM subscriptions WHERE pack_id IS NOT NULL;

CREATE INDEX idx_payment_packs_pack_id ON payment_packs(pack_id);
CREATE INDEX idx_subscription_pack_assignments_pack_id ON subscription_pack_assignments(pack_id);
