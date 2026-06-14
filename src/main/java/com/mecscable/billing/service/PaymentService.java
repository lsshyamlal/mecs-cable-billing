package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.PackSummary;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeAreaAssignmentRepository employeeAreaAssignmentRepository;
    private final SubscriptionPackRepository subscriptionPackRepository;
    private final AuditService auditService;

    public PaymentService(PaymentRepository paymentRepository,
                          CustomerRepository customerRepository,
                          SubscriptionRepository subscriptionRepository,
                          AdminRepository adminRepository,
                          EmployeeRepository employeeRepository,
                          EmployeeAreaAssignmentRepository employeeAreaAssignmentRepository,
                          SubscriptionPackRepository subscriptionPackRepository,
                          AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.adminRepository = adminRepository;
        this.employeeRepository = employeeRepository;
        this.employeeAreaAssignmentRepository = employeeAreaAssignmentRepository;
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
                .filter(s -> List.of(SubscriptionStatus.SCHEDULED, SubscriptionStatus.GRACE, SubscriptionStatus.PAYMENT_PENDING)
                        .contains(s.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No payable subscription found for " + firstOfMonth.getMonth() + " " + firstOfMonth.getYear()));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        boolean manualOverride = Boolean.TRUE.equals(request.manualOverride());
        Set<SubscriptionPack> packs = resolvePacks(request.packIds(), manualOverride);

        OffsetDateTime payDate = OffsetDateTime.now(IST);

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setSubscription(targetSub);
        payment.setAmount(request.amount());
        payment.setPaymentDate(payDate);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRecordedBy(admin);
        payment.setNotes(request.notes());
        payment.setPacks(packs);
        payment.setManualOverride(manualOverride);
        payment = paymentRepository.save(payment);

        targetSub.setStatus(SubscriptionStatus.PAID);
        targetSub.setPacks(new LinkedHashSet<>(packs));
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
            nextSub.setStatus(SubscriptionStatus.SCHEDULED);
            nextSub.setEnrolledBy(admin);
            nextSub.setPacks(new LinkedHashSet<>(packs));
            subscriptionRepository.save(nextSub);
        }

        customer.setLastPaymentAmount(request.amount());
        customer.setLastPaymentDate(payDate.atZoneSameInstant(IST).toLocalDate());
        customer.setCurrentPaymentAmount(request.amount());
        // currentSubscriptionStart/End and currentPaymentDueDate all stay on the paid month
        // so the UI shows consistent PAID-period info. The scheduler advances all three to
        // the next subscription when it transitions ACTIVE → GRACE.
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

    @Transactional
    public PaymentResponse recordPaymentByEmployee(Long customerId, RecordPaymentRequest request, Long employeeId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot record payment for a suspended customer");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        boolean hasAccess = employeeAreaAssignmentRepository
                .findByEmployee(employee)
                .stream()
                .anyMatch(a -> a.getArea().getAreaId().equals(customer.getArea().getAreaId()));
        if (!hasAccess) {
            throw new AccessDeniedException("Employee does not manage this customer's area");
        }

        LocalDate firstOfMonth = request.forMonth().withDayOfMonth(1);
        LocalDate lastOfMonth = firstOfMonth.withDayOfMonth(firstOfMonth.lengthOfMonth());
        Subscription targetSub = subscriptionRepository
                .findByCustomerAndStartDateBetween(customer, firstOfMonth, lastOfMonth)
                .stream()
                .filter(s -> List.of(SubscriptionStatus.SCHEDULED, SubscriptionStatus.GRACE, SubscriptionStatus.PAYMENT_PENDING)
                        .contains(s.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No payable subscription found for " + firstOfMonth.getMonth() + " " + firstOfMonth.getYear()));

        boolean manualOverride = Boolean.TRUE.equals(request.manualOverride());
        Set<SubscriptionPack> packs = resolvePacks(request.packIds(), manualOverride);

        OffsetDateTime payDate = OffsetDateTime.now(IST);

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setSubscription(targetSub);
        payment.setAmount(request.amount());
        payment.setPaymentDate(payDate);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRecordedByEmployee(employee);
        payment.setNotes(request.notes());
        payment.setPacks(packs);
        payment.setManualOverride(manualOverride);
        payment = paymentRepository.save(payment);

        targetSub.setStatus(SubscriptionStatus.PAID);
        targetSub.setPacks(new LinkedHashSet<>(packs));
        subscriptionRepository.save(targetSub);

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
            nextSub.setStatus(SubscriptionStatus.SCHEDULED);
            nextSub.setPacks(new LinkedHashSet<>(packs));
            subscriptionRepository.save(nextSub);
        }

        customer.setLastPaymentAmount(request.amount());
        customer.setLastPaymentDate(payDate.atZoneSameInstant(IST).toLocalDate());
        customer.setCurrentPaymentAmount(request.amount());
        customerRepository.save(customer);

        auditService.logWithRole(employeeId, "EMPLOYEE", "RECORD_PAYMENT", "Payment", payment.getPaymentId(),
                "{\"amount\":" + request.amount() + ",\"forMonth\":\"" + firstOfMonth + "\",\"customerId\":" + customerId + "}");

        return toResponse(payment);
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private Set<SubscriptionPack> resolvePacks(List<Long> packIds, boolean manualOverride) {
        if (manualOverride) {
            if (packIds != null && !packIds.isEmpty()) {
                throw new IllegalArgumentException("Manual override cannot be combined with selected packs");
            }
            return new LinkedHashSet<>();
        }
        if (packIds == null || packIds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        Set<SubscriptionPack> packs = new LinkedHashSet<>();
        for (Long id : packIds) {
            SubscriptionPack pack = subscriptionPackRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Subscription pack not found: " + id));
            packs.add(pack);
        }
        return packs;
    }

    private PaymentResponse toResponse(Payment p) {
        Customer c = p.getCustomer();
        Admin a = p.getRecordedBy();
        Employee emp = p.getRecordedByEmployee();
        Subscription sub = p.getSubscription();
        LocalDate forMonth = sub != null ? sub.getStartDate().withDayOfMonth(1) : null;
        List<PackSummary> packs = p.getPacks().stream()
                .map(pk -> new PackSummary(pk.getPackId(), pk.getPackName()))
                .toList();
        return new PaymentResponse(
                p.getPaymentId(),
                c.getCustomerId(),
                c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : ""),
                sub != null ? sub.getSubscriptionId() : null,
                forMonth,
                p.getAmount(),
                p.getPaymentDate(),
                p.getPaymentMethod(),
                a != null ? a.getAdminId() : null,
                a != null ? (a.getFirstName() + (a.getLastName() != null ? " " + a.getLastName() : "")) : null,
                emp != null ? emp.getEmployeeId() : null,
                emp != null ? (emp.getFirstName() + (emp.getLastName() != null ? " " + emp.getLastName() : "")) : null,
                p.getNotes(),
                p.getCreatedAt(),
                sub != null ? sub.getStatus().name() : null,
                packs,
                p.isManualOverride()
        );
    }
}
