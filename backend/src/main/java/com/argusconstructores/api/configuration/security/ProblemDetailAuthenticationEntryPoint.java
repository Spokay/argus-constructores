package com.argusconstructores.api.configuration.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;

/**
 * Gives an unauthenticated request a body. Spring Security answers one inside the filter
 * chain, before the dispatcher servlet, so no {@code @ControllerAdvice} sees it and the
 * default response is a bare 401 with an empty body.
 *
 * <p>It delegates to {@link BearerTokenAuthenticationEntryPoint} first, which sets the status
 * and the RFC 6750 {@code WWW-Authenticate} header — the header telling the client how to
 * authenticate is worth keeping — and then hands the exception to the MVC exception resolver
 * so the body comes from {@code GlobalExceptionHandler}, like every other error.
 */
@Component
public class ProblemDetailAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final AuthenticationEntryPoint delegate = new BearerTokenAuthenticationEntryPoint();

    private final HandlerExceptionResolver resolver;

    public ProblemDetailAuthenticationEntryPoint(
            @Lazy @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.resolver = resolver;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        delegate.commence(request, response, authException);
        resolver.resolveException(request, response, null, authException);
    }
}
