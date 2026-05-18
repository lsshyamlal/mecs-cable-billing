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
        LocalDate gracePeriodDeadline = null;
        if (c.getCurrentSubscriptionEnd() != null) {
            int gracePeriodDay = c.getArea().getGracePeriodDay();
            gracePeriodDeadline = YearMonth.from(c.getCurrentSubscriptionEnd()).plusMonths(1).atDay(gracePeriodDay);
        }
        return new PortalCurrentSubscriptionResponse(
                c.getCurrentSubscriptionStart(),
                c.getCurrentSubscriptionEnd(),
                c.getCurrentPaymentAmount(),
                c.getStatus().name(),
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
                    LocalDate gracePeriodDeadline = YearMonth.from(s.getEndDate()).plusMonths(1).atDay(gracePeriodDay);
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
