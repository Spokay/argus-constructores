package com.argusconstructores.api.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.Duration;

/** Rendered as a 429 problem detail with a Retry-After header, like ResourceNotFoundException. */
public class TooManyLoginAttemptsException extends ErrorResponseException {

    public TooManyLoginAttemptsException(Duration retryAfter) {
        super(HttpStatus.TOO_MANY_REQUESTS, problemDetail(), null);
        // Rounded up: telling a client to come back a fraction of a second early only earns it another 429.
        long seconds = retryAfter.plusNanos(999_999_999).toSeconds();
        getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(seconds));
    }

    private static ProblemDetail problemDetail() {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.TOO_MANY_REQUESTS, "Too many failed login attempts; try again later");
        problemDetail.setTitle("Too Many Requests");
        return problemDetail;
    }
}
