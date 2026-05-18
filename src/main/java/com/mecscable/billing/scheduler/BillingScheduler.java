package com.mecscable.billing.scheduler;

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
import java.time.ZoneId;
import java.util.List;

@Component
public class BillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingScheduler.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final int GRACE_DAYS = 5;

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
    public void advanceSubscriptionStatuses() {
        LocalDate today = LocalDate.now(IST);
        log.info("Billing scheduler started for date: {}", today);

        int graceCount = moveActiveToGrace(today);
        int pendingCount = moveGraceToPaymentPending(today);

        log.info("Billing scheduler complete: {} moved to GRACE, {} moved to PAYMENT_PENDING",
                graceCount, pendingCount);
    }

    private int moveActiveToGrace(LocalDate today) {
        List<Subscription> expired = subscriptionRepository
                .findByStatusAndEndDateBefore(SubscriptionStatus.ACTIVE, today);

        for (Subscription sub : expired) {
            sub.setStatus(SubscriptionStatus.GRACE);
            subscriptionRepository.save(sub);
            log.debug("Subscription {} moved to GRACE (ended {})",
                    sub.getSubscriptionId(), sub.getEndDate());
        }
        return expired.size();
    }

    private int moveGraceToPaymentPending(LocalDate today) {
        // Grace period is GRACE_DAYS after subscription end date
        LocalDate graceCutoff = today.minusDays(GRACE_DAYS);

        List<Subscription> graceExpired = subscriptionRepository
                .findByStatusAndEndDateBefore(SubscriptionStatus.GRACE, graceCutoff);

        for (Subscription sub : graceExpired) {
            sub.setStatus(SubscriptionStatus.PAYMENT_PENDING);
            subscriptionRepository.save(sub);

            Customer customer = sub.getCustomer();
            customer.setPaymentPending(true);
            customerRepository.save(customer);

            auditService.logSystem("PAYMENT_PENDING", "Subscription",
                    sub.getSubscriptionId(), null);

            log.debug("Subscription {} moved to PAYMENT_PENDING, customer {} flagged",
                    sub.getSubscriptionId(), customer.getCustomerId());
        }
        return graceExpired.size();
    }
}
