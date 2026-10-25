package com.argusconstructores.api.exception;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

import com.argusconstructores.api.configuration.logging.RequestIdFilter;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The catch-all path, which no MockMvc test can reach without a controller that exists only
 * to throw.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void anUnexpectedExceptionNeverLeaksItsMessage() {
        ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest("GET", "/musics"));

        ResponseEntity<Object> response =
                handler.handleUnexpected(new IllegalStateException("connection string: user:secret@db"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ProblemDetail body = (ProblemDetail) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getDetail()).doesNotContain("secret");
        assertThat(body.getInstance()).hasToString("/musics");
    }

    @Test
    void theTraceIdOfTheCurrentRequestIsAddedToTheBody() {
        MDC.put(RequestIdFilter.TRACE_ID_MDC_KEY, "trace-42");
        ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest("GET", "/musics"));

        ResponseEntity<Object> response = handler.handleUnexpected(new IllegalStateException("boom"), request);

        ProblemDetail body = (ProblemDetail) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getProperties()).containsEntry(RequestIdFilter.TRACE_ID_MDC_KEY, "trace-42");
    }
}
