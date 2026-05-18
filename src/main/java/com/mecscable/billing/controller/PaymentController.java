package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.RecordPaymentRequest;
import com.mecscable.billing.dto.response.PaymentResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{customerId}")
    public ResponseEntity<PaymentResponse> recordPayment(
            @PathVariable Long customerId,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.recordPayment(customerId, request, principal.getUserId()));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<List<PaymentResponse>> listByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(paymentService.listByCustomer(customerId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> listAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(paymentService.listAll(from, to));
    }
}
