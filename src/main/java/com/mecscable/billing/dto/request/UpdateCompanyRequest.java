package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateCompanyRequest(
        @NotBlank(message = "Company name is required")
        String companyName,

        @NotNull(message = "Active flag is required")
        Boolean active,

        Long cityId
) {}
