package com.mecscable.billing.dto.response;

import java.time.LocalDate;

public record EmployeeCustomerSummaryResponse(
        Long customerId,
        String fullName,
        String phone,
        String stbId,
        String doorNumber,
        String streetName,
        Long areaId,
        String areaName,
        String status,
        String currentSubscriptionStatus,
        LocalDate currentPaymentDueDate
) {}
