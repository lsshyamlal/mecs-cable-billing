package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PortalSubscriptionHistoryItem(
        Long subscriptionId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyRate,
        String status,
        OffsetDateTime paymentDate,
        LocalDate gracePeriodDeadline
) {}
