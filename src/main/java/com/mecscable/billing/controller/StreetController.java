package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateStreetRequest;
import com.mecscable.billing.dto.response.StreetResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.StreetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/streets")
public class StreetController {

    private final StreetService streetService;

    public StreetController(StreetService streetService) {
        this.streetService = streetService;
    }

    @GetMapping
    public ResponseEntity<List<StreetResponse>> getStreets(@RequestParam(required = false) Long areaId) {
        return ResponseEntity.ok(streetService.getStreets(areaId));
    }

    @PostMapping
    public ResponseEntity<StreetResponse> createStreet(@Valid @RequestBody CreateStreetRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(streetService.createStreet(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StreetResponse> updateStreet(@PathVariable Long id,
                                                       @Valid @RequestBody CreateStreetRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(streetService.updateStreet(id, request, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStreet(@PathVariable Long id,
                                             @AuthenticationPrincipal UserPrincipal principal) {
        streetService.deleteStreet(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
