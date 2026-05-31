package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.AssignEmployeeAreasRequest;
import com.mecscable.billing.dto.request.CreateEmployeeRequest;
import com.mecscable.billing.dto.request.EmployeeResetPasswordRequest;
import com.mecscable.billing.dto.request.UpdateEmployeeRequest;
import com.mecscable.billing.dto.response.EmployeeResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees(
            @RequestParam(required = false) Long groupId) {
        if (groupId != null) {
            return ResponseEntity.ok(employeeService.getEmployeesByGroup(groupId));
        }
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> updateEmployee(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateEmployeeRequest request,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request, principal.getUserId()));
    }

    @PostMapping("/{id}/password-reset")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                              @Valid @RequestBody EmployeeResetPasswordRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        employeeService.resetPassword(id, request, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/areas")
    public ResponseEntity<EmployeeResponse> assignAreas(@PathVariable Long id,
                                                        @Valid @RequestBody AssignEmployeeAreasRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(employeeService.assignAreas(id, request, principal.getUserId()));
    }

    @DeleteMapping("/{id}/areas/{areaId}")
    public ResponseEntity<Void> removeArea(@PathVariable Long id,
                                           @PathVariable Long areaId,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        employeeService.removeArea(id, areaId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        employeeService.deleteEmployee(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
