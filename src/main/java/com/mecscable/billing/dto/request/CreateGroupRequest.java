package com.mecscable.billing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateGroupRequest(
        @NotNull(message = "Company ID is required")
        Long companyId,

        @NotBlank(message = "Group name is required")
        String groupName
) {}
