package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record CompanyResponse(
        Long companyId,
        String companyName,
        boolean active,
        Long cityId,
        String cityName,
        OffsetDateTime createdAt
) {}
