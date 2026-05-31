package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Employee;
import com.mecscable.billing.entity.EmployeeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByPhone(String phone);

    boolean existsByPhone(String phone);

    List<Employee> findByGroupOrderByFirstNameAsc(EmployeeGroup group);
}
