package com.argusconstructores.api.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * There is no sign-up endpoint: the first admin comes from the environment, and only while
 * the table is empty, so changing ADMIN_PASSWORD later never silently resets an account.
 */
@Component
public class AdminAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminAccountSeeder(UserAccountRepository userAccountRepository,
                              PasswordEncoder passwordEncoder,
                              @Value("${admin.username:}") String username,
                              @Value("${admin.password:}") String password) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userAccountRepository.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            log.warn("No user account exists and ADMIN_USERNAME / ADMIN_PASSWORD are not set: nobody can log in");
            return;
        }
        userAccountRepository.save(new UserAccount(username, passwordEncoder.encode(password), Role.ADMIN));
        log.info("Seeded admin account '{}'", username);
    }
}
