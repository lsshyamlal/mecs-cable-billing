package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.Street;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StreetRepository extends JpaRepository<Street, Long> {

    List<Street> findAllByOrderByStreetNameAsc();

    List<Street> findByAreaOrderByStreetNameAsc(Area area);

    boolean existsByAreaAndStreetNameIgnoreCase(Area area, String streetName);

    long countByArea(Area area);
}
