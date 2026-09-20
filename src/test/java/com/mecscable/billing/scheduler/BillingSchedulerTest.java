package com.mecscable.billing.scheduler;

import com.mecscable.billing.dto.response.SchedulerResultResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.SchedulerRunLogRepository;
import com.mecscable.billing.repository.SubscriptionRepository;
import com.mecscable.billing.service.AuditService;
import com.mecscable.billing.service.CustomerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BillingSchedulerTest {
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private AuditService auditService;
    @Mock private CustomerService customerService;
    @Mock private SchedulerRunLogRepository schedulerRunLogRepository;
    @InjectMocks private BillingScheduler billingScheduler;

    @Test
    void schedulerMovesDueSubscriptionsToGraceThenOverdueOnesToPendingAndLogsCounts() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        Customer scheduledCustomer = customer(CustomerStatus.ACTIVE, 10);
        Subscription scheduled = subscription(scheduledCustomer, today, SubscriptionStatus.SCHEDULED);
        Customer overdueCustomer = customer(CustomerStatus.ACTIVE, 1);
        Subscription overdue = subscription(overdueCustomer, today.minusMonths(1).withDayOfMonth(1), SubscriptionStatus.GRACE);
        given(subscriptionRepository.findByStatusAndStartDateLessThanEqual(SubscriptionStatus.SCHEDULED, today)).willReturn(List.of(scheduled));
        given(subscriptionRepository.findByStatus(SubscriptionStatus.GRACE)).willReturn(List.of(overdue));
        given(subscriptionRepository.findByDeactivationDateLessThanEqualAndStatusNotIn(eq(today), any())).willReturn(List.of());

        SchedulerResultResponse result = billingScheduler.advanceSubscriptionStatuses("admin@mecs.com");

        assertThat(result).isEqualTo(new SchedulerResultResponse(1, 1, 0));
        assertThat(scheduled.getStatus()).isEqualTo(SubscriptionStatus.GRACE);
        assertThat(scheduledCustomer.getCurrentSubscriptionStart()).isEqualTo(today);
        assertThat(scheduledCustomer.getCurrentPaymentDueDate()).isEqualTo(today);
        assertThat(overdue.getStatus()).isEqualTo(SubscriptionStatus.PAYMENT_PENDING);
        verify(auditService).logSystem("PAYMENT_PENDING", "Subscription", overdue.getSubscriptionId(), null);
        ArgumentCaptor<SchedulerRunLog> log = ArgumentCaptor.forClass(SchedulerRunLog.class);
        verify(schedulerRunLogRepository).save(log.capture());
        assertThat(log.getValue().getRunDate()).isEqualTo(today);
        assertThat(log.getValue().getTriggeredBy()).isEqualTo("admin@mecs.com");
        assertThat(log.getValue().getGraceCount()).isOne();
        assertThat(log.getValue().getPendingCount()).isOne();
    }

    @Test
    void schedulerDoesNotMarkAnAccountClosedCustomerOverdue() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        Customer closedCustomer = customer(CustomerStatus.ACCOUNT_CLOSED, 1);
        Subscription grace = subscription(closedCustomer, today.minusMonths(1).withDayOfMonth(1), SubscriptionStatus.GRACE);
        given(subscriptionRepository.findByStatusAndStartDateLessThanEqual(SubscriptionStatus.SCHEDULED, today)).willReturn(List.of());
        given(subscriptionRepository.findByStatus(SubscriptionStatus.GRACE)).willReturn(List.of(grace));
        given(subscriptionRepository.findByDeactivationDateLessThanEqualAndStatusNotIn(eq(today), any())).willReturn(List.of());

        SchedulerResultResponse result = billingScheduler.advanceSubscriptionStatuses("SYSTEM");

        assertThat(result.pendingCount()).isZero();
        assertThat(grace.getStatus()).isEqualTo(SubscriptionStatus.GRACE);
    }

    @Test
    void schedulerAppliesDueDeactivationAndLetsCustomerStatusBeRecalculated() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        Customer customer = customer(CustomerStatus.ACTIVE, 10);
        Subscription due = subscription(customer, today.withDayOfMonth(1), SubscriptionStatus.GRACE);
        due.setDeactivationDate(today);
        given(subscriptionRepository.findByStatusAndStartDateLessThanEqual(SubscriptionStatus.SCHEDULED, today)).willReturn(List.of());
        given(subscriptionRepository.findByStatus(SubscriptionStatus.GRACE)).willReturn(List.of());
        given(subscriptionRepository.findByDeactivationDateLessThanEqualAndStatusNotIn(eq(today), any())).willReturn(List.of(due));

        SchedulerResultResponse result = billingScheduler.advanceSubscriptionStatuses("SYSTEM");

        assertThat(result.deactivatedCount()).isOne();
        assertThat(due.getStatus()).isEqualTo(SubscriptionStatus.SUSPENDED);
        verify(customerService).recalcCustomerStatusAfterSubscriptionChange(customer, null);
        verify(auditService).logSystem("DEACTIVATE_SUBSCRIPTION", "Subscription", due.getSubscriptionId(), null);
    }

    private static Customer customer(CustomerStatus status, int graceDay) {
        Area area = new Area(); area.setGracePeriodDay(graceDay);
        Customer customer = new Customer(); customer.setStatus(status); customer.setArea(area); return customer;
    }
    private static Subscription subscription(Customer customer, LocalDate start, SubscriptionStatus status) {
        Subscription subscription = new Subscription();
        ReflectionTestUtils.setField(subscription, "subscriptionId", 42L);
        subscription.setCustomer(customer); subscription.setStartDate(start); subscription.setEndDate(start.withDayOfMonth(start.lengthOfMonth()));
        subscription.setMonthlyRate(java.math.BigDecimal.valueOf(300)); subscription.setStatus(status); return subscription;
    }
}
