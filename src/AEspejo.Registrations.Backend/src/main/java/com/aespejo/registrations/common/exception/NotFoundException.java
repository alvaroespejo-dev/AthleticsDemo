package com.aespejo.registrations.common.exception;

/**
 * Thrown when a requested record does not exist. Mapped to HTTP 404.
 * The entity is given as a message key (for example {@code entity.event}) so the response can be
 * translated into the user's language.
 */
public class NotFoundException extends RuntimeException {

    private final String entityKey;
    private final Object id;

    public NotFoundException(String entityKey, Object id) {
        super(entityKey);
        this.entityKey = entityKey;
        this.id = id;
    }

    public String getEntityKey() {
        return entityKey;
    }

    public Object getId() {
        return id;
    }
}
