package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByStatus(CustomerStatus status);

    List<Customer> findByArea(Area area);

    List<Customer> findByAreaAndStatus(Area area, CustomerStatus status);

    List<Customer> findByPaymentPendingTrue();

    Optional<Customer> findByStbIdAndStatus(String stbId, CustomerStatus status);

    long countByStatus(CustomerStatus status);

    long countByPaymentPendingTrue();

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhoneOrEmail(String phone, String email);
}
