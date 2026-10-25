package com.argusconstructores.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Thrown when a requested resource does not exist.
 *
 * <p>It extends {@link ErrorResponseException}, which already implements {@code ErrorResponse},
 * so Spring renders it as an RFC 9457 {@code application/problem+json} body with no handler
 * method of its own — {@link GlobalExceptionHandler} only adds the trace id. A bespoke
 * exception hierarchy carrying its own status and message would duplicate what the framework
 * already models; copy this class when you need another status.
 */
public class ResourceNotFoundException extends ErrorResponseException {

    public ResourceNotFoundException(String resource, Object id) {
        super(HttpStatus.NOT_FOUND, problemDetail(resource, id), null);
    }

    private static ProblemDetail problemDetail(String resource, Object id) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, "%s %s not found".formatted(resource, id));
        problemDetail.setTitle("Not Found");
        return problemDetail;
    }
}
