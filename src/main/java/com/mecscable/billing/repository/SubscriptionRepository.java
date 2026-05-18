package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.Subscription;
import com.mecscable.billing.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByCustomerOrderByStartDateDesc(Customer customer);

    Optional<Subscription> findByCustomerAndStatus(Customer customer, SubscriptionStatus status);

    List<Subscription> findByCustomerAndStatusInOrderByStartDateDesc(Customer customer, Collection<SubscriptionStatus> statuses);

    // Used by daily scheduler: find subscriptions past end date in a given status
    List<Subscription> findByStatusAndEndDateBefore(SubscriptionStatus status, LocalDate date);

    // Customer portal: last 12 months of subscription history
    List<Subscription> findByCustomerAndStartDateAfterOrderByStartDateDesc(Customer customer, LocalDate since);
}
