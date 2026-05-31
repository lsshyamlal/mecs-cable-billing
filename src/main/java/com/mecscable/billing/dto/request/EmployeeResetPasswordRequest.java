package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EmployeeResetPasswordRequest(
        @NotBlank(message = "New password is required")
        String newPassword
) {}
