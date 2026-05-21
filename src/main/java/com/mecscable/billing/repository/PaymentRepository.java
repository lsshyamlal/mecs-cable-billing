package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.Payment;
import com.mecscable.billing.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerOrderByPaymentDateDesc(Customer customer);

    List<Payment> findByPaymentDateBetweenOrderByPaymentDateDesc(OffsetDateTime from, OffsetDateTime to);

    List<Payment> findByCustomerAndPaymentDateBetween(Customer customer, OffsetDateTime from, OffsetDateTime to);

    Optional<Payment> findFirstBySubscriptionOrderByPaymentDateDesc(Subscription subscription);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate BETWEEN :from AND :to")
    BigDecimal sumAmountByPaymentDateBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}
