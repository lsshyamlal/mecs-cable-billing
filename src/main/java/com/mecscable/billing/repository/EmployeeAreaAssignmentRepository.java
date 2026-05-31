package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.Employee;
import com.mecscable.billing.entity.EmployeeAreaAssignment;
import com.mecscable.billing.entity.EmployeeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeAreaAssignmentRepository extends JpaRepository<EmployeeAreaAssignment, Long> {

    List<EmployeeAreaAssignment> findByEmployee(Employee employee);

    List<EmployeeAreaAssignment> findByArea(Area area);

    boolean existsByEmployeeAndArea(Employee employee, Area area);

    boolean existsByAreaAndEmployee_GroupAndEmployeeNot(Area area, EmployeeGroup group, Employee employee);

    void deleteByEmployeeAndArea(Employee employee, Area area);
}
