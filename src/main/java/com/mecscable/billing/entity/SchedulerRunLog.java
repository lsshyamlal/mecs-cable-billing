package com.mecscable.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "scheduler_run_logs")
@Getter
@Setter
@NoArgsConstructor
public class SchedulerRunLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_date", nullable = false)
    private LocalDate runDate;

    @CreationTimestamp
    @Column(name = "run_at", nullable = false, updatable = false)
    private OffsetDateTime runAt;

    @Column(name = "triggered_by", nullable = false, length = 100)
    private String triggeredBy;

    @Column(name = "grace_count", nullable = false)
    private int graceCount;

    @Column(name = "pending_count", nullable = false)
    private int pendingCount;

    @Column(name = "deactivated_count", nullable = false)
    private int deactivatedCount;

    public SchedulerRunLog(LocalDate runDate, String triggeredBy, int graceCount, int pendingCount, int deactivatedCount) {
        this.runDate = runDate;
        this.triggeredBy = triggeredBy;
        this.graceCount = graceCount;
        this.pendingCount = pendingCount;
        this.deactivatedCount = deactivatedCount;
    }
}
