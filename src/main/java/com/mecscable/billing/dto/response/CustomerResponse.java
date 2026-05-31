package com.mecscable.billing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CustomerResponse(
        Long customerId,
        String firstName,
        String lastName,
        String doorNumber,
        Long streetId,
        String streetName,
        Long areaId,
        String areaName,
        Long cityId,
        String cityName,
        String phone,
        String email,
        String upiId,
        String stbId,
        String status,
        String subscriptionStatus,
        BigDecimal lastPaymentAmount,
        LocalDate lastPaymentDate,
        BigDecimal currentPaymentAmount,
        LocalDate currentPaymentDate,
        LocalDate currentPaymentDueDate,
        LocalDate currentSubscriptionStart,
        LocalDate currentSubscriptionEnd,
        LocalDate gracePeriodDeadline,
        OffsetDateTime accountCreatedAt,
        String futureSubscriptionStatus,
        Long currentPackId,
        String currentPackName
) {}
