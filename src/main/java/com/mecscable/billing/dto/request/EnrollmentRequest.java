package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EnrollmentRequest(
        LocalDate startDate,
        @DecimalMin(value = "0.01", message = "Monthly rate must be greater than 0")
        BigDecimal monthlyRate
) {}
