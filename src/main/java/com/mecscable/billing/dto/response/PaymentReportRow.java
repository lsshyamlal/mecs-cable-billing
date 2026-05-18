package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentReportRow(
        Long paymentId,
        LocalDate paymentDate,
        Long customerId,
        String customerName,
        String areaName,
        String phone,
        BigDecimal amount,
        String paymentMethod,
        String recordedByName,
        String notes
) {}
