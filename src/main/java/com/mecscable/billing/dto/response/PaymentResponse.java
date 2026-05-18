package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long paymentId,
        Long customerId,
        String customerName,
        Long subscriptionId,
        LocalDate forMonth,
        BigDecimal amount,
        LocalDate paymentDate,
        String paymentMethod,
        Long recordedByAdminId,
        String recordedByName,
        String notes,
        OffsetDateTime createdAt
) {}
