package com.mecscable.billing.repository;

import com.mecscable.billing.entity.SchedulerRunLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchedulerRunLogRepository extends JpaRepository<SchedulerRunLog, Long> {

    Page<SchedulerRunLog> findAllByOrderByRunAtDesc(Pageable pageable);
}
