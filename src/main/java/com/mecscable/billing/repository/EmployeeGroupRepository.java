package com.mecscable.billing.repository;

import com.mecscable.billing.entity.City;
import com.mecscable.billing.entity.Company;
import com.mecscable.billing.entity.EmployeeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeGroupRepository extends JpaRepository<EmployeeGroup, Long> {

    List<EmployeeGroup> findByCompanyOrderByGroupNameAsc(Company company);

    List<EmployeeGroup> findByCityOrderByGroupNameAsc(City city);

    boolean existsByCompanyAndCityAndGroupNameIgnoreCase(Company company, City city, String groupName);
}
