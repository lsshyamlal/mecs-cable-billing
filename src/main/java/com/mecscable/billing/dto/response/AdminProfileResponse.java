package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;

public record AdminProfileResponse(
        Long adminId,
        String firstName,
        String lastName,
        String email,
        String phone,
        OffsetDateTime createdAt,
        OffsetDateTime lastLoginAt
) {}
