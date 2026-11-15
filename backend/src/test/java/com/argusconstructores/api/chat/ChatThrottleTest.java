package com.argusconstructores.api.chat;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChatThrottleTest {

    private Instant now = Instant.parse("2026-11-15T12:00:00Z");
    private final ChatThrottle throttle = new ChatThrottle(new Clock() {
        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    });

    @Test
    void refusesOnceTheMinuteIsUsedUpThenResetsTheNextMinute() {
        for (int i = 0; i < ChatThrottle.MAX_PER_MINUTE; i++) {
            throttle.acquire();
        }
        assertThatThrownBy(throttle::acquire).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("429");

        now = now.plus(Duration.ofMinutes(1));
        assertThatCode(throttle::acquire).doesNotThrowAnyException();
    }
}
