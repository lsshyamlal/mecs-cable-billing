package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PortalCurrentSubscriptionResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyRate,
        String status,
        LocalDate dueDate,
        boolean paymentPending,
        LocalDate gracePeriodDeadline
) {}
