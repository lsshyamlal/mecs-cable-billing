package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AreaRepository extends JpaRepository<Area, Long> {

    boolean existsByCityAndAreaNameIgnoreCase(City city, String areaName);

    List<Area> findAllByOrderByAreaNameAsc();

    List<Area> findByCityOrderByAreaNameAsc(City city);

    long countByCity(City city);
}
