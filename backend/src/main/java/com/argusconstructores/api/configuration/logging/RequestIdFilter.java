package com.argusconstructores.api.configuration.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Gives every request an id, puts it in the logging MDC and echoes it back to the caller.
 *
 * <p>It runs at {@link Ordered#HIGHEST_PRECEDENCE}, ahead of Spring Security's filter chain
 * (registered at -100), so a request rejected with 401 before it ever reaches a controller
 * still has an id in its log lines and in its error body.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String TRACE_ID_MDC_KEY = "traceId";

    /**
     * An inbound id is written into a response header and into every log line, so it is
     * accepted only in a shape that can inject into neither. Anything else is replaced by a
     * generated id rather than rejected — a malformed header is not worth failing a request.
     */
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestId = resolveRequestId(request.getHeader(REQUEST_ID_HEADER));
        MDC.put(TRACE_ID_MDC_KEY, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            // The container reuses threads: leaving the key set would stamp the next
            // request handled by this thread with the id of this one.
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }

    private static String resolveRequestId(String inbound) {
        return inbound != null && SAFE_REQUEST_ID.matcher(inbound).matches()
                ? inbound
                : UUID.randomUUID().toString();
    }
}
