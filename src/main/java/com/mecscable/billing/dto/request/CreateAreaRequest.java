package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateAreaRequest(
        @NotBlank(message = "Area name is required") String areaName
) {}
