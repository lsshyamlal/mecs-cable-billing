package com.mecscable.billing.service;

import com.mecscable.billing.dto.response.PortalCurrentSubscriptionResponse;
import com.mecscable.billing.dto.response.PortalProfileResponse;
import com.mecscable.billing.dto.response.PortalSubscriptionHistoryItem;
import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.PaymentRepository;
import com.mecscable.billing.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class PortalService {

    private final CustomerRepository customerRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;

    public PortalService(CustomerRepository customerRepository,
                         SubscriptionRepository subscriptionRepository,
                         PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
    }

    public PortalProfileResponse getProfile(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return new PortalProfileResponse(
                c.getCustomerId(),
                c.getFirstName(),
                c.getLastName(),
                c.getDoorNumber(),
                c.getStreetName(),
                c.getArea().getAreaName(),
                c.getPhone(),
                c.getEmail(),
                c.getStbId(),
                c.getStatus().name(),
                c.getAccountCreatedAt(),
                c.getSuspendedAt()
        );
    }

    public PortalCurrentSubscriptionResponse getCurrentSubscription(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        // Resolve the actual subscription status (GRACE, PAYMENT_PENDING, PAID, etc.)
        // Fall back to the customer-level status only when no subscription start date is recorded.
        String subscriptionStatus = c.getStatus().name();
        LocalDate gracePeriodDeadline = null;
        if (c.getCurrentSubscriptionStart() != null) {
            subscriptionStatus = subscriptionRepository
                    .findFirstByCustomerAndStartDate(c, c.getCurrentSubscriptionStart())
                    .map(s -> s.getStatus().name())
                    .orElse(c.getStatus().name());

            int gracePeriodDay = c.getArea().getGracePeriodDay();
            LocalDate rawDeadline = YearMonth.from(c.getCurrentSubscriptionStart()).atDay(gracePeriodDay);
            gracePeriodDeadline = rawDeadline.isBefore(c.getCurrentSubscriptionStart())
                    ? c.getCurrentSubscriptionStart() : rawDeadline;
        }

        return new PortalCurrentSubscriptionResponse(
                c.getCurrentSubscriptionStart(),
                c.getCurrentSubscriptionEnd(),
                c.getCurrentPaymentAmount(),
                subscriptionStatus,
                c.getCurrentPaymentDueDate(),
                c.isPaymentPending(),
                gracePeriodDeadline
        );
    }

    public List<PortalSubscriptionHistoryItem> getSubscriptionHistory(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        int gracePeriodDay = c.getArea().getGracePeriodDay();
        LocalDate since = LocalDate.now().minusMonths(12);
        return subscriptionRepository
                .findByCustomerAndStartDateAfterOrderByStartDateDesc(c, since)
                .stream()
                .map(s -> {
                    LocalDate paymentDate = paymentRepository
                            .findFirstBySubscriptionOrderByPaymentDateDesc(s)
                            .map(p -> p.getPaymentDate())
                            .orElse(null);
                    LocalDate rawDeadline = YearMonth.from(s.getStartDate()).atDay(gracePeriodDay);
                    LocalDate gracePeriodDeadline = rawDeadline.isBefore(s.getStartDate())
                            ? s.getStartDate() : rawDeadline;
                    return new PortalSubscriptionHistoryItem(
                            s.getSubscriptionId(),
                            s.getStartDate(),
                            s.getEndDate(),
                            s.getMonthlyRate(),
                            s.getStatus().name(),
                            paymentDate,
                            gracePeriodDeadline
                    );
                })
                .toList();
    }
}
