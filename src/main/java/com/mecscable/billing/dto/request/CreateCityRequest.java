package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateCityRequest(
        @NotBlank(message = "City name is required") String cityName,
        Long companyId
) {}
