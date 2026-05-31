package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateCustomerRequest(
        @NotBlank(message = "First name is required") String firstName,
        String lastName,
        String doorNumber,
        Long streetId,
        @NotNull(message = "Area is required") Long areaId,
        @NotBlank(message = "Phone is required") String phone,
        String email,
        String upiId,
        String stbId,
        String portalPassword,
        LocalDate subscriptionStartDate
) {}
