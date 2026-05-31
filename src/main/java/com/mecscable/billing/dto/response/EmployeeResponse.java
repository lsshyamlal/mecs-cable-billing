package com.mecscable.billing.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record EmployeeResponse(
        Long employeeId,
        Long groupId,
        String groupName,
        Long companyId,
        String companyName,
        String firstName,
        String lastName,
        String phone,
        String email,
        boolean active,
        OffsetDateTime createdAt,
        List<AssignedAreaItem> assignedAreas
) {
    public record AssignedAreaItem(Long areaId, String areaName, Long cityId, String cityName) {}
}
