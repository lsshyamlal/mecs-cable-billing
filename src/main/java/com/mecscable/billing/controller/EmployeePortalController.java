package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.EmployeeCustomerSummaryResponse;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.EmployeePortalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee")
public class EmployeePortalController {

    private final EmployeePortalService employeePortalService;

    public EmployeePortalController(EmployeePortalService employeePortalService) {
        this.employeePortalService = employeePortalService;
    }

    @GetMapping("/customers")
    public ResponseEntity<List<EmployeeCustomerSummaryResponse>> listCustomers(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(employeePortalService.listCustomers(principal.getUserId()));
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<EmployeeCustomerSummaryResponse> getCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(employeePortalService.getCustomer(principal.getUserId(), customerId));
    }

    @GetMapping("/customers/{customerId}/payments")
    public ResponseEntity<List<PaymentResponse>> getPaymentHistory(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(employeePortalService.getPaymentHistory(principal.getUserId(), customerId));
    }

    @PostMapping("/payments/{customerId}")
    public ResponseEntity<PaymentResponse> recordPayment(
            @PathVariable Long customerId,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeePortalService.recordPayment(principal.getUserId(), customerId, request));
    }
}
