package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record CompanyResponse(
        Long companyId,
        String companyName,
        boolean active,
        OffsetDateTime createdAt
) {}
