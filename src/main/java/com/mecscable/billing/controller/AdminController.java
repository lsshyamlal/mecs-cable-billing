package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.ChangeAdminPasswordRequest;
import com.mecscable.billing.dto.request.UpdateAdminProfileRequest;
import com.mecscable.billing.dto.response.AdminProfileResponse;
import com.mecscable.billing.dto.response.SchedulerResultResponse;
import com.mecscable.billing.dto.response.SchedulerRunLogResponse;
import com.mecscable.billing.entity.SchedulerRunLog;
import com.mecscable.billing.repository.SchedulerRunLogRepository;
import com.mecscable.billing.scheduler.BillingScheduler;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.AdminService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BillingScheduler billingScheduler;
    private final AdminService adminService;
    private final SchedulerRunLogRepository schedulerRunLogRepository;

    public AdminController(BillingScheduler billingScheduler, AdminService adminService,
                           SchedulerRunLogRepository schedulerRunLogRepository) {
        this.billingScheduler = billingScheduler;
        this.adminService = adminService;
        this.schedulerRunLogRepository = schedulerRunLogRepository;
    }

    @PostMapping("/scheduler/run")
    public ResponseEntity<SchedulerResultResponse> runScheduler(@AuthenticationPrincipal UserPrincipal principal) {
        String triggeredBy = "Admin #" + principal.getUserId();
        return ResponseEntity.ok(billingScheduler.advanceSubscriptionStatuses(triggeredBy));
    }

    @GetMapping("/scheduler/logs")
    public ResponseEntity<Page<SchedulerRunLogResponse>> getSchedulerLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<SchedulerRunLog> logs = schedulerRunLogRepository
                .findAllByOrderByRunAtDesc(PageRequest.of(page, size));
        return ResponseEntity.ok(logs.map(SchedulerRunLogResponse::from));
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
            @Valid @RequestBody ChangeAdminPasswordRequest req,
            HttpServletResponse response) {
        adminService.changePassword(principal.getUserId(), req, response);
        return ResponseEntity.ok().build();
    }
}
