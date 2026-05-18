package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.LoginRequest;
import com.mecscable.billing.dto.response.LoginResponse;
import com.mecscable.billing.entity.Admin;
import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.CustomerStatus;
import com.mecscable.billing.repository.AdminRepository;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Optional;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${mecs.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${mecs.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Value("${mecs.cookie.secure}")
    private boolean cookieSecure;

    public AuthService(AdminRepository adminRepository,
                       CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.adminRepository = adminRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        Optional<Admin> adminOpt = adminRepository.findByEmail(request.identifier());
        if (adminOpt.isPresent()) {
            return authenticateAdmin(adminOpt.get(), request.password(), response);
        }

        Optional<Customer> customerOpt = customerRepository.findByPhoneOrEmail(
                request.identifier(), request.identifier());
        if (customerOpt.isPresent()) {
            return authenticateCustomer(customerOpt.get(), request.password(), response);
        }

        throw new BadCredentialsException("Invalid credentials");
    }

    public void logout(HttpServletResponse response) {
        clearCookies(response);
    }

    public LoginResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractCookie(request, "refresh_token");
        if (refreshToken == null || !jwtService.isTokenValid(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String subject = jwtService.extractSubject(refreshToken);

        Optional<Admin> adminOpt = adminRepository.findByEmail(subject);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            String newAccessToken = jwtService.generateAccessToken(
                    admin.getEmail(), "ROLE_ADMIN", admin.getAdminId());
            addCookie(response, "access_token", newAccessToken, accessTokenExpiryMs / 1000);
            return toLoginResponse(admin);
        }

        Customer customer = customerRepository.findByPhone(subject)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        String newAccessToken = jwtService.generateAccessToken(
                customer.getPhone(), "ROLE_CUSTOMER", customer.getCustomerId());
        addCookie(response, "access_token", newAccessToken, accessTokenExpiryMs / 1000);
        return toLoginResponse(customer);
    }

    private LoginResponse authenticateAdmin(Admin admin, String rawPassword, HttpServletResponse response) {
        if (!passwordEncoder.matches(rawPassword, admin.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (!admin.isActive()) {
            throw new DisabledException("Admin account is disabled");
        }
        admin.setLastLoginAt(OffsetDateTime.now());
        adminRepository.save(admin);

        String accessToken = jwtService.generateAccessToken(admin.getEmail(), "ROLE_ADMIN", admin.getAdminId());
        String refreshToken = jwtService.generateRefreshToken(admin.getEmail());
        addCookie(response, "access_token", accessToken, accessTokenExpiryMs / 1000);
        addCookie(response, "refresh_token", refreshToken, refreshTokenExpiryMs / 1000);
        return toLoginResponse(admin);
    }

    private LoginResponse authenticateCustomer(Customer customer, String rawPassword, HttpServletResponse response) {
        if (customer.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, customer.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new DisabledException("Customer account is suspended");
        }

        String accessToken = jwtService.generateAccessToken(
                customer.getPhone(), "ROLE_CUSTOMER", customer.getCustomerId());
        String refreshToken = jwtService.generateRefreshToken(customer.getPhone());
        addCookie(response, "access_token", accessToken, accessTokenExpiryMs / 1000);
        addCookie(response, "refresh_token", refreshToken, refreshTokenExpiryMs / 1000);
        return toLoginResponse(customer);
    }

    private void addCookie(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCookies(HttpServletResponse response) {
        addCookie(response, "access_token", "", 0);
        addCookie(response, "refresh_token", "", 0);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private LoginResponse toLoginResponse(Admin admin) {
        String name = admin.getFirstName()
                + (admin.getLastName() != null ? " " + admin.getLastName() : "");
        return new LoginResponse("ROLE_ADMIN", admin.getAdminId(), name, admin.getEmail());
    }

    private LoginResponse toLoginResponse(Customer customer) {
        String name = customer.getFirstName()
                + (customer.getLastName() != null ? " " + customer.getLastName() : "");
        return new LoginResponse("ROLE_CUSTOMER", customer.getCustomerId(), name, customer.getEmail());
    }
}
