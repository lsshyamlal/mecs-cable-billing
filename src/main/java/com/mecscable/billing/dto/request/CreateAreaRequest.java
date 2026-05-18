package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAreaRequest(
        @NotBlank(message = "Area name is required") String areaName,
        @NotNull(message = "Grace period day is required")
        @Min(value = 1, message = "Grace period day must be between 1 and 28")
        @Max(value = 28, message = "Grace period day must be between 1 and 28")
        Integer gracePeriodDay
) {}
