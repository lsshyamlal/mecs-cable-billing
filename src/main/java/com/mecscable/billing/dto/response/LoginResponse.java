package com.mecscable.billing.dto.response;

public record LoginResponse(
        String role,
        Long userId,
        String name,
        String email
) {}
