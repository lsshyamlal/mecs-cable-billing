package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateStreetRequest(
        @NotNull(message = "Area is required") Long areaId,
        @NotBlank(message = "Street name is required") String streetName
) {}
