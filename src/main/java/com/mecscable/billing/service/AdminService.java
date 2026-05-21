package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.ChangeAdminPasswordRequest;
import com.mecscable.billing.dto.request.UpdateAdminProfileRequest;
import com.mecscable.billing.dto.response.AdminProfileResponse;
import com.mecscable.billing.entity.Admin;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.AdminRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminService(AdminRepository adminRepository,
                        PasswordEncoder passwordEncoder,
                        AuditService auditService) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public AdminProfileResponse getProfile(Long adminId) {
        Admin admin = findAdmin(adminId);
        return toResponse(admin);
    }

    @Transactional
    public AdminProfileResponse updateProfile(Long adminId, UpdateAdminProfileRequest req) {
        Admin admin = findAdmin(adminId);

        if (!admin.getEmail().equalsIgnoreCase(req.email()) &&
                adminRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email address is already in use.");
        }

        admin.setFirstName(req.firstName());
        admin.setLastName(req.lastName());
        admin.setEmail(req.email());
        admin.setPhone(req.phone());

        Admin saved = adminRepository.save(admin);
        auditService.log(adminId, "UPDATE_PROFILE", "Admin", adminId, null);
        return toResponse(saved);
    }

    @Transactional
    public void changePassword(Long adminId, ChangeAdminPasswordRequest req) {
        Admin admin = findAdmin(adminId);

        if (!passwordEncoder.matches(req.currentPassword(), admin.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }

        admin.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        adminRepository.save(admin);
        auditService.log(adminId, "CHANGE_PASSWORD", "Admin", adminId, null);
    }

    private Admin findAdmin(Long adminId) {
        return adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found."));
    }

    private AdminProfileResponse toResponse(Admin admin) {
        return new AdminProfileResponse(
                admin.getAdminId(),
                admin.getFirstName(),
                admin.getLastName(),
                admin.getEmail(),
                admin.getPhone(),
                admin.getCreatedAt(),
                admin.getLastLoginAt()
        );
    }
}
