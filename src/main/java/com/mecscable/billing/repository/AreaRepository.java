package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Long> {

    Optional<Area> findByAreaNameIgnoreCase(String areaName);

    boolean existsByAreaNameIgnoreCase(String areaName);

    List<Area> findAllByOrderByAreaNameAsc();
}
