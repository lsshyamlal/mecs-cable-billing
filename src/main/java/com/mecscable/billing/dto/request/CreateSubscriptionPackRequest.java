package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateSubscriptionPackRequest(
        @NotBlank(message = "Pack name is required") String packName,
        @NotNull(message = "Monthly rate is required")
        @DecimalMin(value = "0.01", message = "Monthly rate must be greater than 0")
        BigDecimal monthlyRate,
        String description
) {}
