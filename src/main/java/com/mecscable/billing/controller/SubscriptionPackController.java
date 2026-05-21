package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateSubscriptionPackRequest;
import com.mecscable.billing.dto.response.SubscriptionPackResponse;
import com.mecscable.billing.service.SubscriptionPackService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscription-packs")
public class SubscriptionPackController {

    private final SubscriptionPackService packService;

    public SubscriptionPackController(SubscriptionPackService packService) {
        this.packService = packService;
    }

    @GetMapping
    public ResponseEntity<List<SubscriptionPackResponse>> getAllPacks() {
        return ResponseEntity.ok(packService.getAllPacks());
    }

    @PostMapping
    public ResponseEntity<SubscriptionPackResponse> createPack(@Valid @RequestBody CreateSubscriptionPackRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(packService.createPack(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPackResponse> updatePack(@PathVariable Long id,
                                                               @Valid @RequestBody CreateSubscriptionPackRequest request) {
        return ResponseEntity.ok(packService.updatePack(id, request));
    }
}
