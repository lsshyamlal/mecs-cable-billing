package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateCompanyRequest(
        @NotBlank(message = "Company name is required")
        String companyName
) {}
