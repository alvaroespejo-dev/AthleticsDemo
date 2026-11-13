package com.aespejo.registrations.infrastructure.security;

import com.aespejo.registrations.domain.entities.User;
import com.aespejo.registrations.domain.enums.UserRole;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first administrator when the users table is empty. The password comes from the
 * {@code INITIAL_ADMIN_PASSWORD} environment variable. If the variable is not set, nothing is created.
 */
@Component
public class InitialAdminSeeder implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(InitialAdminSeeder.class);
    private static final String ADMIN_LOGIN_NAME = "admin";

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String initialPassword;

    public InitialAdminSeeder(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            @Value("${security.initial-admin-password:}") String initialPassword) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.initialPassword = initialPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0 || initialPassword == null || initialPassword.isBlank()) {
            return;
        }
        User admin = new User();
        admin.setLoginName(ADMIN_LOGIN_NAME);
        admin.setName("Administrator");
        admin.setPasswordHash(passwordEncoder.encode(initialPassword));
        admin.setRole(UserRole.Admin);
        admin.setActive(true);
        admin.setCreatedAt(OffsetDateTime.now());
        users.save(admin);
        LOG.info("Initial administrator '{}' created.", ADMIN_LOGIN_NAME);
    }
}
