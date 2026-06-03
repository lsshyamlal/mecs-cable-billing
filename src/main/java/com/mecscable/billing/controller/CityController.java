package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateCityRequest;
import com.mecscable.billing.dto.response.CityResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.CityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    public ResponseEntity<List<CityResponse>> getAllCities() {
        return ResponseEntity.ok(cityService.getAllCities());
    }

    @PostMapping
    public ResponseEntity<CityResponse> createCity(@Valid @RequestBody CreateCityRequest request,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cityService.createCity(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CityResponse> updateCity(@PathVariable Long id,
                                                   @Valid @RequestBody CreateCityRequest request,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cityService.updateCity(id, request, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCity(@PathVariable Long id,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        cityService.deleteCity(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
