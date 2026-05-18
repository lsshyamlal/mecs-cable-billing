package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecordPaymentRequest(
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        BigDecimal amount,

        @NotNull(message = "Month this payment is for is required (e.g. 2026-05-01)")
        LocalDate forMonth,

        LocalDate paymentDate,
        String paymentMethod,
        String notes
) {}
