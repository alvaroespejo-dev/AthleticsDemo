package com.aespejo.registrations.common.exception;

/** Thrown when a client exceeds a rate limit. Mapped to HTTP 429 with a Retry-After hint. */
public class TooManyRequestsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(long retryAfterSeconds) {
        super("error.rateLimited");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
