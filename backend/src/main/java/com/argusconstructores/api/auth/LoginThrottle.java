package com.argusconstructores.api.auth;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Locks a username for {@link #LOCK} after {@link #MAX_FAILURES} failed logins within the same
 * window. Keyed by username rather than IP: the IP behind Vercel and nginx would come from a
 * forwarded header that a direct caller can forge.
 *
 * <p>shortcut: in memory, so it is per instance and reset by a restart; fine while the API runs
 * as a single container on the VPS, move it to the database if it ever scales out.
 */
@Component
public class LoginThrottle {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK = Duration.ofMinutes(15);
    /** Bounds memory when someone sprays random usernames. */
    private static final int MAX_TRACKED = 10_000;

    private final Clock clock;
    private final Map<String, Failures> failuresByUsername = new ConcurrentHashMap<>();

    public LoginThrottle(Clock clock) {
        this.clock = clock;
    }

    public void checkAllowed(String username) {
        Failures failures = failuresByUsername.get(key(username));
        Instant now = clock.instant();
        if (failures != null && failures.count() >= MAX_FAILURES && now.isBefore(failures.expiresAt())) {
            throw new TooManyLoginAttemptsException(Duration.between(now, failures.expiresAt()));
        }
    }

    public void recordFailure(String username) {
        Instant now = clock.instant();
        if (failuresByUsername.size() >= MAX_TRACKED) {
            failuresByUsername.values().removeIf(failures -> !now.isBefore(failures.expiresAt()));
        }
        failuresByUsername.merge(key(username), new Failures(1, now.plus(LOCK)), (current, first) ->
                now.isBefore(current.expiresAt()) ? new Failures(current.count() + 1, now.plus(LOCK)) : first);
    }

    public void recordSuccess(String username) {
        failuresByUsername.remove(key(username));
    }

    private static String key(String username) {
        return username.strip().toLowerCase(Locale.ROOT);
    }

    /** {@code expiresAt} is pushed back by each failure, so the lock runs from the last one. */
    private record Failures(int count, Instant expiresAt) {
    }
}
