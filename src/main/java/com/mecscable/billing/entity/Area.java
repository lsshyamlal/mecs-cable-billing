package com.mecscable.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "areas")
@Getter
@Setter
@NoArgsConstructor
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "area_id")
    private Long areaId;

    @Column(name = "area_name", unique = true, nullable = false, length = 200)
    private String areaName;

    // Day of the month (1–28) within the subscription's start month by which payment must be received
    @Column(name = "grace_period_day", nullable = false)
    private int gracePeriodDay = 5;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
