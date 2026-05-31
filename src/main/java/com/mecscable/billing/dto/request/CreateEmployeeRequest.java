package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEmployeeRequest(
        @NotNull(message = "Group ID is required")
        Long groupId,

        @NotBlank(message = "First name is required")
        String firstName,

        String lastName,

        @NotBlank(message = "Phone is required")
        String phone,

        String email,

        @NotBlank(message = "Password is required")
        String password
) {}
