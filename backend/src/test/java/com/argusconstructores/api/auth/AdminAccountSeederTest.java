package com.argusconstructores.api.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import com.argusconstructores.api.TestcontainersConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AdminAccountSeederTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void theAdminIsSeededWithAHashedPassword() {
        UserAccount admin = userAccountRepository.findByUsername("admin").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.getPasswordHash()).isNotEqualTo("admin-password");
        assertThat(passwordEncoder.matches("admin-password", admin.getPasswordHash())).isTrue();
    }

    @Test
    void anExistingAccountIsNeverOverwrittenOrDuplicated() {
        new AdminAccountSeeder(userAccountRepository, passwordEncoder, "other", "other-password").run(null);

        assertThat(userAccountRepository.count()).isEqualTo(1);
        assertThat(userAccountRepository.findByUsername("other")).isEmpty();
    }
}
