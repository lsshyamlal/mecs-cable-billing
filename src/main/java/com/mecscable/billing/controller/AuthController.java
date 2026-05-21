package com.mecscable.billing.controller;

import com.mecscable.billing.config.ServerInstance;
import com.mecscable.billing.dto.request.LoginRequest;
import com.mecscable.billing.dto.response.LoginResponse;
import com.mecscable.billing.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final ServerInstance serverInstance;

    public AuthController(AuthService authService, ServerInstance serverInstance) {
        this.authService = authService;
        this.serverInstance = serverInstance;
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("instanceId", serverInstance.getInstanceId()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(request, response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(HttpServletRequest request,
                                                  HttpServletResponse response) {
        return ResponseEntity.ok(authService.refresh(request, response));
    }
}
