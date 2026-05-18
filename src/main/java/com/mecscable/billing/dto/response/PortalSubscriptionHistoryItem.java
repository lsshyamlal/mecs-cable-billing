package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PortalSubscriptionHistoryItem(
        Long subscriptionId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyRate,
        String status,
        LocalDate paymentDate
) {}
