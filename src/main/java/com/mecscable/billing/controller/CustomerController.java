package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CloseAccountRequest;
import com.mecscable.billing.dto.request.CreateCustomerRequest;
import com.mecscable.billing.dto.request.EnrollmentRequest;
import com.mecscable.billing.dto.request.ResetPasswordRequest;
import com.mecscable.billing.dto.request.UpdateCustomerRequest;
import com.mecscable.billing.dto.response.CustomerResponse;
import com.mecscable.billing.dto.response.CustomerStatusHistoryItem;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> listCustomers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String futureStatus,
            @RequestParam(required = false) Long areaId) {
        return ResponseEntity.ok(customerService.listCustomers(status, futureStatus, areaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    @GetMapping("/{id}/status-history")
    public ResponseEntity<List<CustomerStatusHistoryItem>> getStatusHistory(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getStatusHistory(id));
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customerService.createCustomer(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @RequestBody UpdateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request, principal.getUserId()));
    }

    @PutMapping("/{id}/close-account")
    public ResponseEntity<Void> closeAccount(
            @PathVariable Long id,
            @RequestBody CloseAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        customerService.closeAccount(id, request.paymentCollected(), request.notes(), principal.getUserId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reenroll")
    public ResponseEntity<CustomerResponse> reEnrollCustomer(
            @PathVariable Long id,
            @Valid @RequestBody EnrollmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.reEnrollCustomer(id, request, principal.getUserId()));
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        customerService.resetPassword(id, request.newPassword(), principal.getUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        customerService.deleteCustomer(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
