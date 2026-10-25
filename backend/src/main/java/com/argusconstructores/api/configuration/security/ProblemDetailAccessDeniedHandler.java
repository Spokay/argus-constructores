package com.argusconstructores.api.configuration.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;

/**
 * The 403 counterpart of {@link ProblemDetailAuthenticationEntryPoint}: the Bearer handler
 * sets the status and the {@code WWW-Authenticate: Bearer error="insufficient_scope"} header,
 * then the MVC exception resolver writes the same ProblemDetail body every other error uses.
 */
@Component
public class ProblemDetailAccessDeniedHandler implements AccessDeniedHandler {

    private final AccessDeniedHandler delegate = new BearerTokenAccessDeniedHandler();

    private final HandlerExceptionResolver resolver;

    public ProblemDetailAccessDeniedHandler(
            @Lazy @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.resolver = resolver;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        delegate.handle(request, response, accessDeniedException);
        resolver.resolveException(request, response, null, accessDeniedException);
    }
}
