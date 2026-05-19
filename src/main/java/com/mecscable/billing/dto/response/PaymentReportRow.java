package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PaymentReportRow(
        Long paymentId,
        OffsetDateTime paymentDate,
        LocalDate forMonth,
        Long customerId,
        String customerName,
        String areaName,
        String phone,
        BigDecimal amount,
        String paymentMethod,
        String recordedByName,
        String notes
) {}
