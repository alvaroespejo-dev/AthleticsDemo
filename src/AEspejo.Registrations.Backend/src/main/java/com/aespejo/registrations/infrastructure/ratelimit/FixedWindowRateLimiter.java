package com.aespejo.registrations.infrastructure.ratelimit;

import com.aespejo.registrations.common.exception.TooManyRequestsException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Fixed-window limiter in memory, with one limit per policy.
 * A key is a policy name, optionally followed by a partition (for example the Auth0 subject). Single instance only:
 * with several API instances each one keeps its own counters.
 */
@Component
public class FixedWindowRateLimiter {

    /** Policy shared by the public athlete search and the Money Sport lookup, as. */
    public static final String ATHLETE_SEARCH = "busqueda-atleta";

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /** Counts one request for {@code key}; throws when the window is already full. */
    public void acquire(String key, int permitLimit, Duration window) {
        long now = System.currentTimeMillis();
        long length = window.toMillis();
        Window updated = windows.compute(key, (k, current) -> {
            if (current == null || now - current.start() >= length) {
                return new Window(now, 1);
            }
            return new Window(current.start(), current.count() + 1);
        });
        if (updated.count() > permitLimit) {
            long retryAfterSeconds = Math.max(1, (updated.start() + length - now) / 1000);
            throw new TooManyRequestsException(retryAfterSeconds);
        }
    }

    private record Window(long start, int count) {
    }
}
