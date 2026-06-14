package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateCompanyRequest;
import com.mecscable.billing.dto.request.UpdateCompanyRequest;
import com.mecscable.billing.dto.response.CompanyResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompany(id));
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(@Valid @RequestBody CreateCompanyRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.createCompany(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(@PathVariable Long id,
                                                         @Valid @RequestBody UpdateCompanyRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(companyService.updateCompany(id, request, principal.getUserId()));
    }

    @PostMapping("/{id}/cities/{cityId}")
    public ResponseEntity<CompanyResponse> linkCity(@PathVariable Long id,
                                                    @PathVariable Long cityId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(companyService.linkCity(id, cityId, principal.getUserId()));
    }

    @DeleteMapping("/{id}/cities/{cityId}")
    public ResponseEntity<CompanyResponse> unlinkCity(@PathVariable Long id,
                                                      @PathVariable Long cityId,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(companyService.unlinkCity(id, cityId, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        companyService.deleteCompany(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
