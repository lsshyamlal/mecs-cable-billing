package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EnrollmentRequest(
        @NotNull(message = "Monthly rate is required") BigDecimal monthlyRate,
        LocalDate startDate
) {}
