package com.mecscable.billing.controller;

import com.mecscable.billing.scheduler.BillingScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BillingScheduler billingScheduler;

    public AdminController(BillingScheduler billingScheduler) {
        this.billingScheduler = billingScheduler;
    }

    @PostMapping("/scheduler/run")
    public ResponseEntity<Void> runScheduler() {
        billingScheduler.advanceSubscriptionStatuses();
        return ResponseEntity.ok().build();
    }
}
