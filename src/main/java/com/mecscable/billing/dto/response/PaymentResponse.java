package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PaymentResponse(
        Long paymentId,
        Long customerId,
        String customerName,
        Long subscriptionId,
        LocalDate forMonth,
        BigDecimal amount,
        OffsetDateTime paymentDate,
        String paymentMethod,
        Long recordedByAdminId,
        String recordedByName,
        Long recordedByEmployeeId,
        String recordedByEmployeeName,
        String notes,
        OffsetDateTime createdAt,
        String subscriptionStatus,
        List<PackSummary> packs,
        boolean manualOverride
) {}
