package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record GroupResponse(
        Long groupId,
        Long companyId,
        String companyName,
        String groupName,
        OffsetDateTime createdAt
) {}
