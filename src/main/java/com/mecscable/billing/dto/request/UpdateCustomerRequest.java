package com.mecscable.billing.dto.request;

import java.math.BigDecimal;

public record UpdateCustomerRequest(
        String firstName,
        String lastName,
        String doorNumber,
        String streetName,
        Long areaId,
        String phone,
        String email,
        String upiId,
        String stbId
) {}
