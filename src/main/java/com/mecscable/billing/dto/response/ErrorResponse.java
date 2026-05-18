package com.mecscable.billing.dto.response;

public record ErrorResponse(
        String code,
        String message
) {}
