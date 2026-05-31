package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateEmployeeRequest(
        @NotBlank(message = "First name is required")
        String firstName,

        String lastName,
        String email,

        @NotNull(message = "Active flag is required")
        Boolean active
) {}
