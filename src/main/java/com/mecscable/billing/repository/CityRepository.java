package com.mecscable.billing.repository;

import com.mecscable.billing.entity.City;
import com.mecscable.billing.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {

    boolean existsByCityNameIgnoreCase(String cityName);

    List<City> findAllByOrderByCityNameAsc();

    List<City> findByCompanyOrderByCityNameAsc(Company company);
}
