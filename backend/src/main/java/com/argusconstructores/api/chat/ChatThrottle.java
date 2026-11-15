package com.argusconstructores.api.chat;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;

/**
 * Caps chat requests for everybody together, which caps the Anthropic bill. Global rather
 * than per IP for the reason given on {@code LoginThrottle}: the client IP behind Vercel and
 * nginx comes from a forwarded header a direct caller can forge.
 *
 * <p>shortcut: in memory and per instance, fine for a single-container demo; drop it with the
 * chat package or move it to a shared store if the API ever scales out.
 */
@Component
public class ChatThrottle {

    static final int MAX_PER_MINUTE = 30;

    private final Clock clock;
    private long currentMinute = -1;
    private int count;

    public ChatThrottle(Clock clock) {
        this.clock = clock;
    }

    public synchronized void acquire() {
        long minute = clock.millis() / 60_000;
        if (minute != currentMinute) {
            currentMinute = minute;
            count = 0;
        }
        if (++count > MAX_PER_MINUTE) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "The assistant is receiving too many questions; try again in a minute");
        }
    }
}
