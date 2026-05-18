package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final AuditService auditService;

    public PaymentService(PaymentRepository paymentRepository,
                          CustomerRepository customerRepository,
                          SubscriptionRepository subscriptionRepository,
                          AdminRepository adminRepository,
                          AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.adminRepository = adminRepository;
        this.auditService = auditService;
    }

    @Transactional
    public PaymentResponse recordPayment(Long customerId, RecordPaymentRequest request, Long adminId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot record payment for a suspended customer");
        }

        Subscription currentSub = subscriptionRepository
                .findByCustomerAndStatusInOrderByStartDateDesc(customer,
                        List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE, SubscriptionStatus.PAYMENT_PENDING))
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No payable subscription found for customer"));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        LocalDate payDate = request.paymentDate() != null ? request.paymentDate() : LocalDate.now(IST);

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setSubscription(currentSub);
        payment.setAmount(request.amount());
        payment.setPaymentDate(payDate);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRecordedBy(admin);
        payment.setNotes(request.notes());
        payment = paymentRepository.save(payment);

        currentSub.setStatus(SubscriptionStatus.PAID);
        subscriptionRepository.save(currentSub);

        LocalDate nextStart = currentSub.getEndDate().plusDays(1);
        LocalDate nextEnd = nextStart.withDayOfMonth(nextStart.lengthOfMonth());

        Subscription nextSub = new Subscription();
        nextSub.setCustomer(customer);
        nextSub.setMonthlyRate(request.amount());
        nextSub.setStartDate(nextStart);
        nextSub.setEndDate(nextEnd);
        nextSub.setStatus(SubscriptionStatus.ACTIVE);
        nextSub.setEnrolledBy(admin);
        subscriptionRepository.save(nextSub);

        customer.setLastPaymentAmount(request.amount());
        customer.setLastPaymentDate(payDate);
        customer.setCurrentPaymentAmount(request.amount());
        customer.setCurrentPaymentDueDate(nextEnd);
        customer.setCurrentSubscriptionStart(nextStart);
        customer.setCurrentSubscriptionEnd(nextEnd);
        customer.setPaymentPending(false);
        customerRepository.save(customer);

        auditService.log(adminId, "RECORD_PAYMENT", "Payment", payment.getPaymentId(),
                "{\"amount\":" + request.amount() + ",\"customerId\":" + customerId + "}");

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
            payments = paymentRepository.findByPaymentDateBetweenOrderByPaymentDateDesc(from, to);
        } else {
            payments = paymentRepository.findAll();
        }
        return payments.stream().map(this::toResponse).toList();
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private PaymentResponse toResponse(Payment p) {
        Customer c = p.getCustomer();
        Admin a = p.getRecordedBy();
        return new PaymentResponse(
                p.getPaymentId(),
                c.getCustomerId(),
                c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : ""),
                p.getSubscription() != null ? p.getSubscription().getSubscriptionId() : null,
                p.getAmount(),
                p.getPaymentDate(),
                p.getPaymentMethod(),
                a.getAdminId(),
                a.getFirstName() + (a.getLastName() != null ? " " + a.getLastName() : ""),
                p.getNotes(),
                p.getCreatedAt()
        );
    }
}
