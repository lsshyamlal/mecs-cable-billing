package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record CompanyResponse(
        Long companyId,
        String companyName,
        boolean active,
        List<CityResponse> cities,
        OffsetDateTime createdAt
) {}
