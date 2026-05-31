package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByCompanyNameIgnoreCase(String companyName);

    List<Company> findAllByOrderByCompanyNameAsc();
}
