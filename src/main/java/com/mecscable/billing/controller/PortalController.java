package com.mecscable.billing.controller;

import com.mecscable.billing.dto.response.PortalCurrentSubscriptionResponse;
import com.mecscable.billing.dto.response.PortalProfileResponse;
import com.mecscable.billing.dto.response.PortalSubscriptionHistoryItem;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.PortalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portal")
public class PortalController {

    private final PortalService portalService;

    public PortalController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/me")
    public ResponseEntity<PortalProfileResponse> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portalService.getProfile(principal.getUserId()));
    }

    @GetMapping("/me/subscription/current")
    public ResponseEntity<PortalCurrentSubscriptionResponse> getCurrentSubscription(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portalService.getCurrentSubscription(principal.getUserId()));
    }

    @GetMapping("/me/subscription/history")
    public ResponseEntity<List<PortalSubscriptionHistoryItem>> getSubscriptionHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portalService.getSubscriptionHistory(principal.getUserId()));
    }
}
