package com.mecscable.billing.dto.request;

public record UpdateCustomerRequest(
        String firstName,
        String lastName,
        String doorNumber,
        Long streetId,
        Long areaId,
        String phone,
        String email,
        String upiId,
        String stbId
) {}
