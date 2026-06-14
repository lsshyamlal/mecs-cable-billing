package com.mecscable.billing.dto.response;

import com.mecscable.billing.entity.SchedulerRunLog;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record SchedulerRunLogResponse(
        Long id,
        LocalDate runDate,
        OffsetDateTime runAt,
        String triggeredBy,
        int graceCount,
        int pendingCount,
        int deactivatedCount
) {
    public static SchedulerRunLogResponse from(SchedulerRunLog log) {
        return new SchedulerRunLogResponse(
                log.getId(),
                log.getRunDate(),
                log.getRunAt(),
                log.getTriggeredBy(),
                log.getGraceCount(),
                log.getPendingCount(),
                log.getDeactivatedCount()
        );
    }
}
