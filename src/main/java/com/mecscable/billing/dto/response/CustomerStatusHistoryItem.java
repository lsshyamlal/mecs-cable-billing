package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record CustomerStatusHistoryItem(
        Long historyId,
        String fromStatus,
        String toStatus,
        OffsetDateTime changedAt,
        Long changedByAdminId,
        String changedByName,
        String notes
) {}
