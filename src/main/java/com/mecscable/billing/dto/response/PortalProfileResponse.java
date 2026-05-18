package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record PortalProfileResponse(
        Long customerId,
        String firstName,
        String lastName,
        String doorNumber,
        String streetName,
        String area,
        String phone,
        String email,
        String stbId,
        String status,
        OffsetDateTime accountCreatedAt,
        OffsetDateTime suspendedAt
) {}
