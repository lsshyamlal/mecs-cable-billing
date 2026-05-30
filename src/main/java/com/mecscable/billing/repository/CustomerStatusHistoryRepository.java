package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.CustomerStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerStatusHistoryRepository extends JpaRepository<CustomerStatusHistory, Long> {

    List<CustomerStatusHistory> findByCustomerOrderByChangedAtDesc(Customer customer);
}
