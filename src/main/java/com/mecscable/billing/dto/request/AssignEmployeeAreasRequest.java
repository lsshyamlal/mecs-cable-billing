package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AssignEmployeeAreasRequest(
        @NotNull(message = "Area IDs are required")
        List<Long> areaIds
) {}
