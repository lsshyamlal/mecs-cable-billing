package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerOrderByPaymentDateDesc(Customer customer);

    List<Payment> findByPaymentDateBetweenOrderByPaymentDateDesc(LocalDate from, LocalDate to);

    List<Payment> findByCustomerAndPaymentDateBetween(Customer customer, LocalDate from, LocalDate to);
}
