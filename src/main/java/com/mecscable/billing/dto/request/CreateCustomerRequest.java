package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCustomerRequest(
        @NotBlank(message = "First name is required") String firstName,
        String lastName,
        String doorNumber,
        Long streetId,
        @NotNull(message = "Area is required") Long areaId,
        @NotNull(message = "Company is required") Long companyId,
        @NotBlank(message = "Phone is required") String phone,
        String email,
        String upiId,
        String stbId,
        String portalPassword,
        LocalDate subscriptionStartDate,
        @NotNull(message = "Monthly rate is required")
        @DecimalMin(value = "0.01", message = "Monthly rate must be greater than 0")
        BigDecimal monthlyRate
) {}
