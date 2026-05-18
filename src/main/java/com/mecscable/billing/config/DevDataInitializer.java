package com.mecscable.billing.config;

import com.mecscable.billing.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataInitializer.class);

    private static final String DEV_ADMIN_EMAIL = "admin@mecs.com";
    private static final String DEV_ADMIN_PASSWORD = "admin123";

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataInitializer(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        adminRepository.findByEmail(DEV_ADMIN_EMAIL).ifPresent(admin -> {
            if (!passwordEncoder.matches(DEV_ADMIN_PASSWORD, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(DEV_ADMIN_PASSWORD));
                adminRepository.save(admin);
                log.info("Dev admin password reset → email: {}, password: {}", DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD);
            }
        });
    }
}
