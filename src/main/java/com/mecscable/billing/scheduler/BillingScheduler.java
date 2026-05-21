package com.mecscable.billing.scheduler;

import com.mecscable.billing.dto.response.SchedulerResultResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.SubscriptionRepository;
import com.mecscable.billing.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Component
public class BillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingScheduler.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final SubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    public BillingScheduler(SubscriptionRepository subscriptionRepository,
                            CustomerRepository customerRepository,
                            AuditService auditService) {
        this.subscriptionRepository = subscriptionRepository;
        this.customerRepository = customerRepository;
        this.auditService = auditService;
    }

    // Runs daily at 3:00 AM IST
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Kolkata")
    @Transactional
    public SchedulerResultResponse advanceSubscriptionStatuses() {
        LocalDate today = LocalDate.now(IST);
        log.info("Billing scheduler started for date: {}", today);

        int graceCount = moveActiveToGrace(today);
        int pendingCount = moveGraceToPaymentPending(today);

        log.info("Billing scheduler complete: {} moved to GRACE, {} moved to PAYMENT_PENDING",
                graceCount, pendingCount);
        return new SchedulerResultResponse(graceCount, pendingCount);
    }

    private int moveActiveToGrace(LocalDate today) {
        // Payment is due on the subscription start date; catches late-day enrollments via <=
        List<Subscription> due = subscriptionRepository
                .findByStatusAndStartDateLessThanEqual(SubscriptionStatus.ACTIVE, today);

        for (Subscription sub : due) {
            if (sub.getCustomer().getStatus() == CustomerStatus.ACCOUNT_CLOSED) continue;
            sub.setStatus(SubscriptionStatus.GRACE);
            subscriptionRepository.save(sub);

            // Advance the customer's current-subscription pointer so the UI shows this
            // subscription (GRACE) rather than the prior month's PAID subscription.
            Customer customer = sub.getCustomer();
            customer.setCurrentSubscriptionStart(sub.getStartDate());
            customer.setCurrentSubscriptionEnd(sub.getEndDate());
            customer.setCurrentPaymentAmount(sub.getMonthlyRate());
            customer.setCurrentPaymentDueDate(sub.getStartDate());
            customerRepository.save(customer);

            log.debug("Subscription {} moved to GRACE (startDate {})",
                    sub.getSubscriptionId(), sub.getStartDate());
        }
        return due.size();
    }

    private int moveGraceToPaymentPending(LocalDate today) {
        List<Subscription> graceSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.GRACE);
        int count = 0;

        for (Subscription sub : graceSubscriptions) {
            if (sub.getCustomer().getStatus() == CustomerStatus.ACCOUNT_CLOSED) continue;
            int gracePeriodDay = sub.getCustomer().getArea().getGracePeriodDay();
            // Grace deadline: area's grace day within the subscription's start month.
            // For mid-month enrollments where gracePeriodDay falls before startDate, use startDate
            // so they aren't immediately flagged before they've had a chance to pay.
            LocalDate rawDeadline = YearMonth.from(sub.getStartDate()).atDay(gracePeriodDay);
            LocalDate graceDeadline = rawDeadline.isBefore(sub.getStartDate()) ? sub.getStartDate() : rawDeadline;

            if (!today.isAfter(graceDeadline)) continue;

            sub.setStatus(SubscriptionStatus.PAYMENT_PENDING);
            subscriptionRepository.save(sub);

            Customer customer = sub.getCustomer();
            customer.setPaymentPending(true);
            customerRepository.save(customer);

            auditService.logSystem("PAYMENT_PENDING", "Subscription",
                    sub.getSubscriptionId(), null);

            log.debug("Subscription {} moved to PAYMENT_PENDING (grace deadline {}), customer {} flagged",
                    sub.getSubscriptionId(), graceDeadline, customer.getCustomerId());
            count++;
        }
        return count;
    }
}
