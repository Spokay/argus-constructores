package com.argusconstructores.api.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.argusconstructores.api.configuration.logging.RequestIdFilter;

import java.net.URI;
import java.util.List;

/**
 * The single definition of what an error looks like on the wire: RFC 9457
 * {@code application/problem+json}, always carrying {@code instance} and {@code traceId}.
 *
 * <p>Extending {@link ResponseEntityExceptionHandler} inherits correct handling of every
 * exception Spring MVC raises itself, and makes Boot's own {@code ProblemDetailsExceptionHandler}
 * back off — it is {@code @ConditionalOnMissingBean(ResponseEntityExceptionHandler.class)},
 * which is why {@code spring.mvc.problemdetails.enabled} is deliberately not set.
 *
 * <p>Denials raised inside the security filter chain never reach a {@code @ControllerAdvice}
 * on their own; the handlers in {@code configuration.security} route them here so that the
 * body of a 401 is written by this class too.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Raised by method security ({@code @PreAuthorize}), which does reach this advice. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN, "Access is denied");
        problemDetail.setTitle("Forbidden");
        return handleExceptionInternal(ex, problemDetail, new HttpHeaders(), HttpStatus.FORBIDDEN, request);
    }

    /** A failed login: same answer for an unknown user and a wrong password. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Object> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED, "Invalid username or password");
        problemDetail.setTitle("Unauthorized");
        return handleExceptionInternal(ex, problemDetail, new HttpHeaders(), HttpStatus.UNAUTHORIZED, request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> handleAuthentication(AuthenticationException ex, WebRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED, "Authentication is required");
        problemDetail.setTitle("Unauthorized");
        return handleExceptionInternal(ex, problemDetail, new HttpHeaders(), HttpStatus.UNAUTHORIZED, request);
    }

    /**
     * The catch-all. The real exception goes to the log with its stack; the caller gets a
     * generic sentence and the trace id, because an exception message can carry internals a
     * client has no business seeing.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        log.error("Unhandled exception", ex);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Quote the traceId when reporting it.");
        problemDetail.setTitle("Internal Server Error");
        return handleExceptionInternal(ex, problemDetail, new HttpHeaders(),
                HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    /**
     * Adds which parameter failed and why. Spring raises this for constraint annotations on
     * controller method parameters; note the controller must <em>not</em> be annotated
     * {@code @Validated}, which would switch it to the older AOP path and a
     * {@code ConstraintViolationException} instead.
     */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problemDetail = ex.getBody();
        problemDetail.setProperty("errors", validationErrors(ex));
        return handleExceptionInternal(ex, problemDetail, headers, status, request);
    }

    /**
     * Every error response funnels through here, which is what guarantees the two fields are
     * always present rather than present on the paths someone remembered to add them to.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        ResponseEntity<Object> response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
        if (response != null && response.getBody() instanceof ProblemDetail problemDetail) {
            enrich(problemDetail, request);
        }
        return response;
    }

    private static void enrich(ProblemDetail problemDetail, WebRequest request) {
        if (problemDetail.getInstance() == null && request instanceof ServletWebRequest servletWebRequest) {
            problemDetail.setInstance(URI.create(servletWebRequest.getRequest().getRequestURI()));
        }
        String traceId = MDC.get(RequestIdFilter.TRACE_ID_MDC_KEY);
        if (traceId != null) {
            problemDetail.setProperty(RequestIdFilter.TRACE_ID_MDC_KEY, traceId);
        }
    }

    private static List<ValidationError> validationErrors(HandlerMethodValidationException ex) {
        return ex.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new ValidationError(fieldName(result), messageOf(error))))
                .toList();
    }

    private static String fieldName(ParameterValidationResult result) {
        String name = result.getMethodParameter().getParameterName();
        return name != null ? name : "parameter" + result.getMethodParameter().getParameterIndex();
    }

    private static String messageOf(MessageSourceResolvable error) {
        String message = error.getDefaultMessage();
        return message != null ? message : "invalid value";
    }

    /** One rejected parameter, as it appears in the {@code errors} array of the body. */
    public record ValidationError(String field, String message) {
    }
}
