package com.argusconstructores.api.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginThrottleTest {

    private Instant now = Instant.parse("2026-10-25T12:00:00Z");
    private final LoginThrottle throttle = new LoginThrottle(new Clock() {
        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    });

    @Test
    void locksAUsernameAfterFiveFailures() {
        failTimes("admin", 4);
        assertThatCode(() -> throttle.checkAllowed("admin")).doesNotThrowAnyException();

        throttle.recordFailure("admin");

        assertThatThrownBy(() -> throttle.checkAllowed("admin"))
                .isInstanceOfSatisfying(TooManyLoginAttemptsException.class, ex -> {
                    assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(ex.getHeaders().getFirst("Retry-After")).isEqualTo("900");
                });
    }

    @Test
    void retryAfterIsRoundedUpToTheNextSecond() {
        failTimes("admin", 5);
        now = now.plusMillis(500);

        assertThatThrownBy(() -> throttle.checkAllowed("admin"))
                .isInstanceOfSatisfying(TooManyLoginAttemptsException.class,
                        ex -> assertThat(ex.getHeaders().getFirst("Retry-After")).isEqualTo("900"));
    }

    @Test
    void theLockIgnoresCaseAndLeavesOtherUsernamesAlone() {
        failTimes("Admin", 5);

        assertThatThrownBy(() -> throttle.checkAllowed("admin")).isInstanceOf(TooManyLoginAttemptsException.class);
        assertThatCode(() -> throttle.checkAllowed("editor")).doesNotThrowAnyException();
    }

    @Test
    void theLockEndsAfterFifteenMinutes() {
        failTimes("admin", 5);

        now = now.plus(Duration.ofMinutes(15));

        assertThatCode(() -> throttle.checkAllowed("admin")).doesNotThrowAnyException();
    }

    @Test
    void failuresOlderThanTheWindowAreForgotten() {
        failTimes("admin", 4);
        now = now.plus(Duration.ofMinutes(16));

        throttle.recordFailure("admin");

        assertThatCode(() -> throttle.checkAllowed("admin")).doesNotThrowAnyException();
    }

    @Test
    void aSuccessfulLoginResetsTheCount() {
        failTimes("admin", 4);
        throttle.recordSuccess("admin");

        throttle.recordFailure("admin");

        assertThatCode(() -> throttle.checkAllowed("admin")).doesNotThrowAnyException();
    }

    private void failTimes(String username, int times) {
        for (int i = 0; i < times; i++) {
            throttle.recordFailure(username);
        }
    }
}
