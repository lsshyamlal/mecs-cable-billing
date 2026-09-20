package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock private PaymentRepository paymentRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private AdminRepository adminRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeAreaAssignmentRepository assignmentRepository;
    @Mock private SubscriptionPackRepository packRepository;
    @Mock private AuditService auditService;
    @Captor private ArgumentCaptor<Subscription> subscriptionCaptor;
    @InjectMocks private PaymentService paymentService;

    private Customer customer;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        customer = customer(10L, CustomerStatus.ACTIVE, area(1L));
        subscription = payableSubscription(customer, LocalDate.of(2026, 9, 1), SubscriptionStatus.GRACE);
        given(customerRepository.findById(10L)).willReturn(Optional.of(customer));
        lenient().when(subscriptionRepository.findByCustomerAndStartDateBetween(eq(customer), any(), any()))
                .thenReturn(List.of(subscription));
    }

    @Test
    void adminPaymentMarksTheChosenPeriodPaidAndCreatesTheNextSubscription() {
        Admin admin = admin(7L);
        SubscriptionPack basic = pack(2L, "Basic");
        given(adminRepository.findById(7L)).willReturn(Optional.of(admin));
        given(packRepository.findById(2L)).willReturn(Optional.of(basic));
        given(subscriptionRepository.findByCustomerAndStartDateBetween(eq(customer),
                eq(LocalDate.of(2026, 10, 1)), eq(LocalDate.of(2026, 10, 31)))).willReturn(List.of());
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "paymentId", 55L);
            return payment;
        });

        PaymentResponse response = paymentService.recordPayment(10L,
                new RecordPaymentRequest(new BigDecimal("350.00"), LocalDate.of(2026, 9, 16),
                        "UPI", "September collection", List.of(2L), false), 7L);

        assertThat(response.paymentId()).isEqualTo(55L);
        assertThat(response.forMonth()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(response.subscriptionStatus()).isEqualTo("PAID");
        assertThat(response.packs()).extracting(p -> p.packName()).containsExactly("Basic");
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.PAID);
        assertThat(customer.getLastPaymentAmount()).isEqualByComparingTo("350.00");
        verify(subscriptionRepository, times(2)).save(subscriptionCaptor.capture());
        assertThat(subscriptionCaptor.getAllValues()).anySatisfy(next -> {
            assertThat(next.getStartDate()).isEqualTo(LocalDate.of(2026, 10, 1));
            assertThat(next.getEndDate()).isEqualTo(LocalDate.of(2026, 10, 31));
            assertThat(next.getStatus()).isEqualTo(SubscriptionStatus.SCHEDULED);
            assertThat(next.getMonthlyRate()).isEqualByComparingTo("350.00");
            assertThat(next.getPacks()).containsExactly(basic);
        });
        verify(auditService).log(eq(7L), eq("RECORD_PAYMENT"), eq("Payment"), eq(55L), contains("2026-09-01"));
    }

    @Test
    void paymentForSuspendedCustomerIsRejectedBeforeAnyMoneyIsRecorded() {
        customer.setStatus(CustomerStatus.SUSPENDED);
        assertThatThrownBy(() -> paymentService.recordPayment(10L,
                new RecordPaymentRequest(new BigDecimal("350"), LocalDate.of(2026, 9, 1), null, null, List.of(), true), 7L))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("suspended customer");
        verifyNoInteractions(paymentRepository, subscriptionRepository, adminRepository, packRepository, auditService);
    }

    @Test
    void manualOverrideCannotBeCombinedWithPacks() {
        given(adminRepository.findById(7L)).willReturn(Optional.of(admin(7L)));
        assertThatThrownBy(() -> paymentService.recordPayment(10L,
                new RecordPaymentRequest(new BigDecimal("300"), LocalDate.of(2026, 9, 1), null, null, List.of(2L), true), 7L))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Manual override cannot be combined with selected packs");
        verifyNoInteractions(paymentRepository, packRepository, auditService);
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.GRACE);
    }

    @Test
    void employeeCanOnlyCollectForAnAssignedArea() {
        Employee employee = new Employee();
        ReflectionTestUtils.setField(employee, "employeeId", 15L);
        employee.setFirstName("Collector");
        given(employeeRepository.findById(15L)).willReturn(Optional.of(employee));
        given(assignmentRepository.findByEmployee(employee)).willReturn(List.of());
        assertThatThrownBy(() -> paymentService.recordPaymentByEmployee(10L,
                new RecordPaymentRequest(new BigDecimal("300"), LocalDate.of(2026, 9, 1), null, null, List.of(), true), 15L))
                .isInstanceOf(AccessDeniedException.class).hasMessage("Employee does not manage this customer's area");
        verifyNoInteractions(paymentRepository, subscriptionRepository, packRepository, auditService);
    }

    @Test
    void missingSelectedPackIsRejected() {
        given(adminRepository.findById(7L)).willReturn(Optional.of(admin(7L)));
        given(packRepository.findById(999L)).willReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.recordPayment(10L,
                new RecordPaymentRequest(new BigDecimal("300"), LocalDate.of(2026, 9, 1), null, null, List.of(999L), false), 7L))
                .isInstanceOf(ResourceNotFoundException.class).hasMessage("Subscription pack not found: 999");
        verifyNoInteractions(paymentRepository, auditService);
    }

    private static Customer customer(Long id, CustomerStatus status, Area area) {
        Customer customer = new Customer();
        ReflectionTestUtils.setField(customer, "customerId", id);
        customer.setFirstName("Test"); customer.setStatus(status); customer.setArea(area);
        return customer;
    }
    private static Area area(Long id) { Area area = new Area(); ReflectionTestUtils.setField(area, "areaId", id); return area; }
    private static Admin admin(Long id) { Admin admin = new Admin(); ReflectionTestUtils.setField(admin, "adminId", id); admin.setFirstName("Admin"); return admin; }
    private static SubscriptionPack pack(Long id, String name) { SubscriptionPack pack = new SubscriptionPack(); ReflectionTestUtils.setField(pack, "packId", id); pack.setPackName(name); return pack; }
    private static Subscription payableSubscription(Customer customer, LocalDate start, SubscriptionStatus status) {
        Subscription subscription = new Subscription();
        ReflectionTestUtils.setField(subscription, "subscriptionId", 20L);
        subscription.setCustomer(customer); subscription.setStartDate(start); subscription.setEndDate(start.withDayOfMonth(start.lengthOfMonth())); subscription.setStatus(status);
        return subscription;
    }
}
