package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateAreaRequest;
import com.mecscable.billing.dto.response.AreaResponse;
import com.mecscable.billing.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ResponseEntity<List<AreaResponse>> getAllAreas() {
        return ResponseEntity.ok(areaService.getAllAreas());
    }

    @PostMapping
    public ResponseEntity<AreaResponse> createArea(@Valid @RequestBody CreateAreaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(areaService.createArea(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AreaResponse> updateArea(@PathVariable Long id,
                                                   @Valid @RequestBody CreateAreaRequest request) {
        return ResponseEntity.ok(areaService.updateArea(id, request));
    }
}
