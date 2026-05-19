package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.ChangeAdminPasswordRequest;
import com.mecscable.billing.dto.request.UpdateAdminProfileRequest;
import com.mecscable.billing.dto.response.AdminProfileResponse;
import com.mecscable.billing.scheduler.BillingScheduler;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BillingScheduler billingScheduler;
    private final AdminService adminService;

    public AdminController(BillingScheduler billingScheduler, AdminService adminService) {
        this.billingScheduler = billingScheduler;
        this.adminService = adminService;
    }

    @PostMapping("/scheduler/run")
    public ResponseEntity<Void> runScheduler() {
        billingScheduler.advanceSubscriptionStatuses();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AdminProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminService.getProfile(principal.getUserId()));
    }

    @PutMapping("/me")
    public ResponseEntity<AdminProfileResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateAdminProfileRequest req) {
        return ResponseEntity.ok(adminService.updateProfile(principal.getUserId(), req));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangeAdminPasswordRequest req) {
        adminService.changePassword(principal.getUserId(), req);
        return ResponseEntity.ok().build();
    }
}
