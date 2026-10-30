package com.aespejo.registrations.common.exception;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates exceptions into RFC 9457 problem responses. The detail text is resolved from the message
 * bundles in the language of the request (Spanish, English or Portuguese).
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private final MessageSource messages;

    public ApiExceptionHandler(MessageSource messages) {
        this.messages = messages;
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException ex) {
        Locale locale = LocaleContextHolder.getLocale();
        String entity = messages.getMessage(ex.getEntityKey(), null, locale);
        return problem(HttpStatus.NOT_FOUND, "not-found",
                messages.getMessage("error.notFound", new Object[] {entity, ex.getId()}, locale));
    }

    @ExceptionHandler(UnauthorizedException.class)
    ProblemDetail handleUnauthorized(UnauthorizedException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized", resolve(ex.getMessageKey(), ex.getArgs()));
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail handleConflict(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, "conflict", resolve(ex.getMessageKey(), ex.getArgs()));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    ResponseEntity<ProblemDetail> handleTooManyRequests(TooManyRequestsException ex) {
        ProblemDetail detail = problem(HttpStatus.TOO_MANY_REQUESTS, "rate-limited", resolve(ex.getMessage(), new Object[0]));
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(detail);
    }

    @ExceptionHandler(BusinessRuleException.class)
    ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "business-rule", resolve(ex.getMessageKey(), ex.getArgs()));
    }

    /** Foreign-key violations, for example deleting a row that other rows still reference. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleIntegrity() {
        return problem(HttpStatus.CONFLICT, "conflict", resolve("error.inUse", new Object[0]));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "validation", resolve("error.invalidFields", new Object[0]));
        Map<String, String> fields = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        // Field messages are either a plain text or a message key from the bundles.
                        error -> error.getDefaultMessage() == null
                                ? resolve("error.invalidValue", new Object[0])
                                : messages.getMessage(error.getDefaultMessage(), null,
                                        error.getDefaultMessage(), LocaleContextHolder.getLocale()),
                        (first, second) -> first));
        detail.setProperty("fields", fields);
        return detail;
    }

    private String resolve(String key, Object[] args) {
        return messages.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    private static ProblemDetail problem(HttpStatus status, String type, String message) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(status, message);
        detail.setType(URI.create("https://aespejo.local/problems/" + type));
        return detail;
    }
}
