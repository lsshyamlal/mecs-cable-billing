package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateCustomerRequest;
import com.mecscable.billing.dto.request.EnrollmentRequest;
import com.mecscable.billing.dto.request.UpdateCustomerRequest;
import com.mecscable.billing.dto.response.CustomerResponse;
import com.mecscable.billing.dto.response.CustomerStatusHistoryItem;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final CustomerRepository customerRepository;
    private final AreaRepository areaRepository;
    private final CityRepository cityRepository;
    private final StreetRepository streetRepository;
    private final AdminRepository adminRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerStatusHistoryRepository statusHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthService authService;

    public CustomerService(CustomerRepository customerRepository,
                           AreaRepository areaRepository,
                           CityRepository cityRepository,
                           StreetRepository streetRepository,
                           AdminRepository adminRepository,
                           SubscriptionRepository subscriptionRepository,
                           PaymentRepository paymentRepository,
                           CustomerStatusHistoryRepository statusHistoryRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService,
                           AuthService authService) {
        this.customerRepository = customerRepository;
        this.areaRepository = areaRepository;
        this.cityRepository = cityRepository;
        this.streetRepository = streetRepository;
        this.adminRepository = adminRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.authService = authService;
    }

    public List<CustomerResponse> listCustomers(String status, String futureStatus,
                                                Long cityId, Long areaId, Long streetId) {
        // Subscription statuses (GRACE, PAYMENT_PENDING, PAID) are not customer-level enums;
        // fetch by the most-specific location filter then filter on the computed subscriptionStatus.
        boolean isSubscriptionStatus = status != null &&
                (status.equals("GRACE") || status.equals("PAYMENT_PENDING") || status.equals("PAID")
                        || status.equals("CANCELLED"));

        // Pick the narrowest available location filter; refine the rest in memory.
        List<Customer> customers;
        if (streetId != null) {
            customers = customerRepository.findByStreet(findStreet(streetId));
        } else if (areaId != null) {
            customers = customerRepository.findByArea(findArea(areaId));
        } else if (cityId != null) {
            customers = customerRepository.findByAreaCity(findCity(cityId));
        } else if (!isSubscriptionStatus && futureStatus == null && status != null) {
            customers = customerRepository.findByStatus(CustomerStatus.valueOf(status));
        } else {
            customers = customerRepository.findAll();
        }

        // Refine by status when status is a customer-level enum and a location filter was applied.
        if (!isSubscriptionStatus && futureStatus == null && status != null
                && (cityId != null || areaId != null || streetId != null)) {
            CustomerStatus s = CustomerStatus.valueOf(status);
            customers = customers.stream().filter(c -> c.getStatus() == s).toList();
        }

        List<CustomerResponse> responses = customers.stream().map(this::toResponse).toList();
        if (isSubscriptionStatus) {
            responses = responses.stream()
                    .filter(r -> status.equals(r.subscriptionStatus()))
                    .toList();
        }
        if (futureStatus != null) {
            responses = responses.stream()
                    .filter(r -> futureStatus.equals(r.futureSubscriptionStatus()))
                    .toList();
        }
        return responses;
    }

    public CustomerResponse getCustomer(Long customerId) {
        return toResponse(findCustomer(customerId));
    }

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request, Long adminId) {
        Area area = findArea(request.areaId());

        if (request.stbId() != null && !request.stbId().isBlank()) {
            customerRepository.findByStbIdAndStatus(request.stbId(), CustomerStatus.ACTIVE)
                    .ifPresent(c -> { throw new IllegalArgumentException("STB ID already assigned to an active customer"); });
        }

        customerRepository.findByPhone(request.phone())
                .ifPresent(c -> { throw new IllegalArgumentException("Phone number already registered to another customer"); });

        Customer customer = new Customer();
        customer.setFirstName(request.firstName());
        customer.setLastName(request.lastName());
        customer.setDoorNumber(request.doorNumber());
        customer.setArea(area);
        if (request.streetId() != null) {
            customer.setStreet(resolveStreetForArea(request.streetId(), area));
        }
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setUpiId(request.upiId());
        customer.setStbId(request.stbId());
        customer.setStatus(CustomerStatus.ACTIVE);

        if (request.portalPassword() != null && !request.portalPassword().isBlank()) {
            customer.setPasswordHash(passwordEncoder.encode(request.portalPassword()));
        }

        customer = customerRepository.save(customer);

        createSubscription(customer, null, request.subscriptionStartDate(), adminId);

        saveStatusEvent(customer, null, CustomerStatus.ACTIVE, adminId, null);
        auditService.log(adminId, "CREATE_CUSTOMER", "Customer", customer.getCustomerId(), null);
        return toResponse(customerRepository.findById(customer.getCustomerId()).orElseThrow());
    }

    @Transactional
    public CustomerResponse updateCustomer(Long customerId, UpdateCustomerRequest request, Long adminId) {
        Customer customer = findCustomer(customerId);

        if (request.firstName() != null) customer.setFirstName(request.firstName());
        if (request.lastName() != null) customer.setLastName(request.lastName());
        if (request.doorNumber() != null) customer.setDoorNumber(request.doorNumber());
        if (request.phone() != null) {
            customerRepository.findByPhone(request.phone())
                    .filter(c -> !c.getCustomerId().equals(customerId))
                    .ifPresent(c -> { throw new IllegalArgumentException("Phone number already registered to another customer"); });
            customer.setPhone(request.phone());
        }
        if (request.email() != null) customer.setEmail(request.email());
        if (request.upiId() != null) customer.setUpiId(request.upiId());

        if (request.stbId() != null) {
            if (!request.stbId().isBlank()) {
                customerRepository.findByStbIdAndStatus(request.stbId(), CustomerStatus.ACTIVE)
                        .filter(c -> !c.getCustomerId().equals(customerId))
                        .ifPresent(c -> { throw new IllegalArgumentException("STB ID already assigned to an active customer"); });
            }
            customer.setStbId(request.stbId().isBlank() ? null : request.stbId());
        }

        if (request.areaId() != null) {
            Area newArea = findArea(request.areaId());
            customer.setArea(newArea);
            // If the existing street belongs to a different area, drop it; the caller
            // can supply a matching streetId in this same request to set a new one.
            if (customer.getStreet() != null
                    && !customer.getStreet().getArea().getAreaId().equals(newArea.getAreaId())) {
                customer.setStreet(null);
            }
        }

        // streetId: explicit overwrite — null clears, any value re-validates against the area.
        Area effectiveArea = customer.getArea();
        if (request.streetId() == null) {
            customer.setStreet(null);
        } else {
            customer.setStreet(resolveStreetForArea(request.streetId(), effectiveArea));
        }

        customer = customerRepository.save(customer);
        auditService.log(adminId, "UPDATE_CUSTOMER", "Customer", customerId, null);
        return toResponse(customer);
    }

    @Transactional
    public void closeAccount(Long customerId, boolean paymentCollected, String notes, Long adminId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() == CustomerStatus.ACCOUNT_CLOSED || customer.getStatus() == CustomerStatus.SUSPENDED) {
            throw new IllegalArgumentException("Customer account is already closed or suspended");
        }
        customer.setStatus(paymentCollected ? CustomerStatus.ACCOUNT_CLOSED : CustomerStatus.SUSPENDED);
        customer.setSuspendedAt(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));
        customerRepository.save(customer);

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        SubscriptionStatus outstandingResolution = paymentCollected ? SubscriptionStatus.PAID : SubscriptionStatus.SUSPENDED;

        // Resolve any open subscriptions for the current period (GRACE, PAYMENT_PENDING, or a
        // current-month ACTIVE that the scheduler hasn't transitioned yet).
        List<Subscription> currentSubs = subscriptionRepository.findByCustomerAndStatusInOrderByStartDateDesc(
                customer, List.of(SubscriptionStatus.GRACE, SubscriptionStatus.PAYMENT_PENDING, SubscriptionStatus.SCHEDULED));
        for (Subscription sub : currentSubs) {
            if (sub.getStartDate().isAfter(today)) {
                // Genuinely future-dated pre-created subscription — cancel it.
                sub.setStatus(SubscriptionStatus.CANCELLED);
            } else {
                // Current-period subscription — resolve based on whether payment was collected.
                sub.setStatus(outstandingResolution);
            }
            subscriptionRepository.save(sub);
        }

        saveStatusEvent(customer, CustomerStatus.ACTIVE,
                paymentCollected ? CustomerStatus.ACCOUNT_CLOSED : CustomerStatus.SUSPENDED,
                adminId, notes);
        auditService.log(adminId, "CLOSE_ACCOUNT", "Customer", customerId, null);
    }

    @Transactional
    public CustomerResponse reEnrollCustomer(Long customerId, EnrollmentRequest request, Long adminId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() != CustomerStatus.SUSPENDED && customer.getStatus() != CustomerStatus.ACCOUNT_CLOSED) {
            throw new IllegalArgumentException("Customer account must be suspended or closed to re-enroll");
        }

        CustomerStatus previousStatus = customer.getStatus();
        customer.setStatus(CustomerStatus.ACTIVE);
        customer.setSuspendedAt(null);
        customerRepository.save(customer);

        Subscription sub = createSubscription(customer, customer.getCurrentPaymentAmount(), request.startDate(), adminId);
        sub.setStatus(SubscriptionStatus.PAYMENT_PENDING);
        subscriptionRepository.save(sub);

        saveStatusEvent(customer, previousStatus, CustomerStatus.ACTIVE, adminId, null);
        auditService.log(adminId, "REENROLL_CUSTOMER", "Customer", customerId, null);
        return toResponse(customerRepository.findById(customerId).orElseThrow());
    }

    @Transactional
    public void resetPassword(Long customerId, String newPassword, Long adminId) {
        Customer customer = findCustomer(customerId);
        customer.setPasswordHash(passwordEncoder.encode(newPassword));
        // Force the customer to re-authenticate on every device: any existing JWT
        // will fail the sid check in JwtAuthFilter on its next request.
        authService.invalidateCustomerSession(customer);
        auditService.log(adminId, "RESET_CUSTOMER_PASSWORD", "Customer", customerId, null);
    }

    @Transactional
    public void deleteCustomer(Long customerId, Long adminId) {
        Customer customer = findCustomer(customerId);
        if (customer.getStatus() == CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot delete an active customer — close the account first");
        }
        paymentRepository.deleteAll(paymentRepository.findByCustomerOrderByPaymentDateDesc(customer));
        subscriptionRepository.deleteAll(subscriptionRepository.findByCustomerOrderByStartDateDesc(customer));
        customerRepository.delete(customer);
        auditService.log(adminId, "DELETE_CUSTOMER", "Customer", customerId, null);
    }

    public List<CustomerStatusHistoryItem> getStatusHistory(Long customerId) {
        Customer customer = findCustomer(customerId);
        return statusHistoryRepository.findByCustomerOrderByChangedAtDesc(customer)
                .stream()
                .map(h -> new CustomerStatusHistoryItem(
                        h.getHistoryId(),
                        h.getFromStatus() != null ? h.getFromStatus().name() : null,
                        h.getToStatus().name(),
                        h.getChangedAt(),
                        h.getChangedBy() != null ? h.getChangedBy().getAdminId() : null,
                        h.getChangedBy() != null
                                ? (h.getChangedBy().getFirstName() + (h.getChangedBy().getLastName() != null
                                        ? " " + h.getChangedBy().getLastName() : "")).trim()
                                : null,
                        h.getNotes()
                ))
                .toList();
    }

    private void saveStatusEvent(Customer customer, CustomerStatus fromStatus,
                                 CustomerStatus toStatus, Long adminId, String notes) {
        CustomerStatusHistory event = new CustomerStatusHistory();
        event.setCustomer(customer);
        event.setFromStatus(fromStatus);
        event.setToStatus(toStatus);
        event.setNotes(notes);
        if (adminId != null) {
            adminRepository.findById(adminId).ifPresent(event::setChangedBy);
        }
        statusHistoryRepository.save(event);
    }

    private Subscription createSubscription(Customer customer, java.math.BigDecimal monthlyRate,
                                    LocalDate startDate, Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        LocalDate start = startDate != null ? startDate : LocalDate.now(IST);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        // Payment is due on the start date, so a subscription starting today or in the past
        // enters GRACE immediately. ACTIVE is reserved for future-dated subscriptions that
        // the scheduler hasn't yet brought live.
        SubscriptionStatus initialStatus = start.isAfter(LocalDate.now(IST))
                ? SubscriptionStatus.SCHEDULED : SubscriptionStatus.GRACE;

        Subscription sub = new Subscription();
        sub.setCustomer(customer);
        sub.setMonthlyRate(monthlyRate);
        sub.setStartDate(start);
        sub.setEndDate(end);
        sub.setStatus(initialStatus);
        sub.setEnrolledBy(admin);
        subscriptionRepository.save(sub);

        customer.setCurrentSubscriptionStart(start);
        customer.setCurrentSubscriptionEnd(end);
        customer.setCurrentPaymentAmount(monthlyRate);
        customer.setCurrentPaymentDueDate(start);
        customerRepository.save(customer);
        return sub;
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private Area findArea(Long areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + areaId));
    }

    private City findCity(Long cityId) {
        return cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + cityId));
    }

    private Street findStreet(Long streetId) {
        return streetRepository.findById(streetId)
                .orElseThrow(() -> new ResourceNotFoundException("Street not found: " + streetId));
    }

    private Street resolveStreetForArea(Long streetId, Area area) {
        Street street = findStreet(streetId);
        if (!street.getArea().getAreaId().equals(area.getAreaId())) {
            throw new IllegalArgumentException("Street does not belong to the selected area");
        }
        return street;
    }

    private CustomerResponse toResponse(Customer c) {
        String subscriptionStatus = null;
        LocalDate gracePeriodDeadline = null;
        Long currentPackId = null;
        String currentPackName = null;
        if (c.getCurrentSubscriptionStart() != null) {
            var currentSub = subscriptionRepository.findFirstByCustomerAndStartDateOrderBySubscriptionIdDesc(c, c.getCurrentSubscriptionStart());
            subscriptionStatus = c.getStatus() == CustomerStatus.SUSPENDED
                    ? "SUSPENDED"
                    : currentSub.map(s -> s.getStatus().name()).orElse(null);
            currentPackId = currentSub.map(s -> s.getPack() != null ? s.getPack().getPackId() : null).orElse(null);
            currentPackName = currentSub.map(s -> s.getPack() != null ? s.getPack().getPackName() : null).orElse(null);
            if (c.getStatus() != CustomerStatus.ACCOUNT_CLOSED) {
                int gracePeriodDay = c.getArea().getGracePeriodDay();
                LocalDate rawDeadline = YearMonth.from(c.getCurrentSubscriptionStart()).atDay(gracePeriodDay);
                gracePeriodDeadline = rawDeadline.isBefore(c.getCurrentSubscriptionStart())
                        ? c.getCurrentSubscriptionStart() : rawDeadline;
            }
        }
        String futureSubscriptionStatus = null;
        if (c.getCurrentSubscriptionEnd() != null) {
            LocalDate futureStart = c.getCurrentSubscriptionEnd().plusDays(1);
            futureSubscriptionStatus = subscriptionRepository
                    .findFirstByCustomerAndStartDateOrderBySubscriptionIdDesc(c, futureStart)
                    .map(s -> s.getStatus().name())
                    .orElse(null);
        }
        Street street = c.getStreet();
        Area area = c.getArea();
        City city = area.getCity();
        return new CustomerResponse(
                c.getCustomerId(),
                c.getFirstName(),
                c.getLastName(),
                c.getDoorNumber(),
                street != null ? street.getStreetId() : null,
                street != null ? street.getStreetName() : null,
                area.getAreaId(),
                area.getAreaName(),
                city.getCityId(),
                city.getCityName(),
                c.getPhone(),
                c.getEmail(),
                c.getUpiId(),
                c.getStbId(),
                c.getStatus().name(),
                subscriptionStatus,
                c.getLastPaymentAmount(),
                c.getLastPaymentDate(),
                c.getCurrentPaymentAmount(),
                c.getCurrentPaymentDate(),
                c.getCurrentPaymentDueDate(),
                c.getCurrentSubscriptionStart(),
                c.getCurrentSubscriptionEnd(),
                gracePeriodDeadline,
                c.getAccountCreatedAt(),
                futureSubscriptionStatus,
                currentPackId,
                currentPackName
        );
    }
}
