package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AdminRepository adminRepository;
    private final SubscriptionPackRepository subscriptionPackRepository;
    private final AuditService auditService;

    public PaymentService(PaymentRepository paymentRepository,
                          CustomerRepository customerRepository,
                          SubscriptionRepository subscriptionRepository,
                          AdminRepository adminRepository,
                          SubscriptionPackRepository subscriptionPackRepository,
                          AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.adminRepository = adminRepository;
        this.subscriptionPackRepository = subscriptionPackRepository;
        this.auditService = auditService;
    }

    @Transactional
    public PaymentResponse recordPayment(Long customerId, RecordPaymentRequest request, Long adminId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot record payment for a suspended customer");
        }

        // Find the subscription for the specified month
        LocalDate firstOfMonth = request.forMonth().withDayOfMonth(1);
        LocalDate lastOfMonth = firstOfMonth.withDayOfMonth(firstOfMonth.lengthOfMonth());
        Subscription targetSub = subscriptionRepository
                .findByCustomerAndStartDateBetween(customer, firstOfMonth, lastOfMonth)
                .stream()
                .filter(s -> List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE, SubscriptionStatus.PAYMENT_PENDING)
                        .contains(s.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No payable subscription found for " + firstOfMonth.getMonth() + " " + firstOfMonth.getYear()));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        SubscriptionPack pack = null;
        if (request.packId() != null) {
            pack = subscriptionPackRepository.findById(request.packId()).orElse(null);
        }

        OffsetDateTime payDate = OffsetDateTime.now(IST);

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setSubscription(targetSub);
        payment.setAmount(request.amount());
        payment.setPaymentDate(payDate);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRecordedBy(admin);
        payment.setNotes(request.notes());
        payment.setPack(pack);
        payment.setManualOverride(request.manualOverride());
        payment = paymentRepository.save(payment);

        targetSub.setStatus(SubscriptionStatus.PAID);
        targetSub.setPack(pack);
        subscriptionRepository.save(targetSub);

        // Create the next month's subscription only if one doesn't already exist
        LocalDate nextStart = targetSub.getEndDate().plusDays(1);
        LocalDate nextEnd = nextStart.withDayOfMonth(nextStart.lengthOfMonth());
        boolean nextExists = subscriptionRepository
                .findByCustomerAndStartDateBetween(customer, nextStart, nextEnd)
                .stream()
                .anyMatch(s -> s.getStatus() != SubscriptionStatus.CANCELLED);
        if (!nextExists) {
            Subscription nextSub = new Subscription();
            nextSub.setCustomer(customer);
            nextSub.setMonthlyRate(request.amount());
            nextSub.setStartDate(nextStart);
            nextSub.setEndDate(nextEnd);
            nextSub.setStatus(SubscriptionStatus.ACTIVE);
            nextSub.setEnrolledBy(admin);
            nextSub.setPack(pack);
            subscriptionRepository.save(nextSub);
        }

        customer.setLastPaymentAmount(request.amount());
        customer.setLastPaymentDate(payDate.atZoneSameInstant(IST).toLocalDate());
        customer.setCurrentPaymentAmount(request.amount());
        // currentSubscriptionStart/End and currentPaymentDueDate all stay on the paid month
        // so the UI shows consistent PAID-period info. The scheduler advances all three to
        // the next subscription when it transitions ACTIVE → GRACE.
        customer.setPaymentPending(false);
        customerRepository.save(customer);

        auditService.log(adminId, "RECORD_PAYMENT", "Payment", payment.getPaymentId(),
                "{\"amount\":" + request.amount() + ",\"forMonth\":\"" + firstOfMonth + "\",\"customerId\":" + customerId + "}");

        return toResponse(payment);
    }

    public List<PaymentResponse> listByCustomer(Long customerId) {
        Customer customer = findCustomer(customerId);
        return paymentRepository.findByCustomerOrderByPaymentDateDesc(customer)
                .stream().map(this::toResponse).toList();
    }

    public List<PaymentResponse> listAll(LocalDate from, LocalDate to) {
        List<Payment> payments;
        if (from != null && to != null) {
            OffsetDateTime fromOdt = from.atStartOfDay(IST).toOffsetDateTime();
            OffsetDateTime toOdt = to.atTime(LocalTime.MAX).atZone(IST).toOffsetDateTime();
            payments = paymentRepository.findByPaymentDateBetweenOrderByPaymentDateDesc(fromOdt, toOdt);
        } else {
            payments = paymentRepository.findAll();
        }
        return payments.stream().map(this::toResponse).toList();
    }

    public BigDecimal monthTotal(YearMonth month) {
        OffsetDateTime from = month.atDay(1).atStartOfDay(IST).toOffsetDateTime();
        OffsetDateTime to = month.atEndOfMonth().atTime(LocalTime.MAX).atZone(IST).toOffsetDateTime();
        return paymentRepository.sumAmountByPaymentDateBetween(from, to);
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private PaymentResponse toResponse(Payment p) {
        Customer c = p.getCustomer();
        Admin a = p.getRecordedBy();
        Subscription sub = p.getSubscription();
        LocalDate forMonth = sub != null ? sub.getStartDate().withDayOfMonth(1) : null;
        SubscriptionPack pack = p.getPack();
        return new PaymentResponse(
                p.getPaymentId(),
                c.getCustomerId(),
                c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : ""),
                sub != null ? sub.getSubscriptionId() : null,
                forMonth,
                p.getAmount(),
                p.getPaymentDate(),
                p.getPaymentMethod(),
                a.getAdminId(),
                a.getFirstName() + (a.getLastName() != null ? " " + a.getLastName() : ""),
                p.getNotes(),
                p.getCreatedAt(),
                sub != null ? sub.getStatus().name() : null,
                pack != null ? pack.getPackId() : null,
                pack != null ? pack.getPackName() : null,
                p.isManualOverride()
        );
    }
}
