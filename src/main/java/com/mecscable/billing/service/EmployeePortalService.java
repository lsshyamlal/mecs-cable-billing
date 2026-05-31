package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.EmployeeCustomerSummaryResponse;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.entity.*;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EmployeePortalService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeAreaAssignmentRepository assignmentRepository;
    private final CustomerRepository customerRepository;
    private final PaymentService paymentService;

    public EmployeePortalService(EmployeeRepository employeeRepository,
                                 EmployeeAreaAssignmentRepository assignmentRepository,
                                 CustomerRepository customerRepository,
                                 PaymentService paymentService) {
        this.employeeRepository = employeeRepository;
        this.assignmentRepository = assignmentRepository;
        this.customerRepository = customerRepository;
        this.paymentService = paymentService;
    }

    public List<EmployeeCustomerSummaryResponse> listCustomers(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        return assignmentRepository.findByEmployee(employee)
                .stream()
                .flatMap(a -> customerRepository.findByAreaAndStatus(a.getArea(), CustomerStatus.ACTIVE).stream())
                .map(this::toSummary)
                .toList();
    }

    public EmployeeCustomerSummaryResponse getCustomer(Long employeeId, Long customerId) {
        Employee employee = findEmployee(employeeId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
        validateAreaAccess(employee, customer);
        return toSummary(customer);
    }

    public List<PaymentResponse> getPaymentHistory(Long employeeId, Long customerId) {
        Employee employee = findEmployee(employeeId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
        validateAreaAccess(employee, customer);
        return paymentService.listByCustomer(customerId);
    }

    @Transactional
    public PaymentResponse recordPayment(Long employeeId, Long customerId, RecordPaymentRequest request) {
        return paymentService.recordPaymentByEmployee(customerId, request, employeeId);
    }

    private void validateAreaAccess(Employee employee, Customer customer) {
        boolean hasAccess = assignmentRepository.findByEmployee(employee)
                .stream()
                .anyMatch(a -> a.getArea().getAreaId().equals(customer.getArea().getAreaId()));
        if (!hasAccess) {
            throw new AccessDeniedException("You do not have access to this customer");
        }
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    private EmployeeCustomerSummaryResponse toSummary(Customer c) {
        Street street = c.getStreet();
        Area area = c.getArea();
        return new EmployeeCustomerSummaryResponse(
                c.getCustomerId(),
                c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : ""),
                c.getPhone(),
                c.getStbId(),
                c.getDoorNumber(),
                street != null ? street.getStreetName() : null,
                area.getAreaId(),
                area.getAreaName(),
                c.getStatus().name(),
                null,
                c.getCurrentPaymentDueDate()
        );
    }
}
