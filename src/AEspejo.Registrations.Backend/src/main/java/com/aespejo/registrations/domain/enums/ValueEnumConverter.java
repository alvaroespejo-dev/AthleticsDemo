package com.aespejo.registrations.domain.enums;

import jakarta.persistence.AttributeConverter;
import java.util.Arrays;

/**
 * Converts an enum to its numeric value and back. {@code EnumType.ORDINAL} is not used because some
 * enums have gaps in their numbering (for example {@code DocumentType.Other = 99}).
 */
public abstract class ValueEnumConverter<E extends Enum<E> & ValueEnum> implements AttributeConverter<E, Integer> {

    private final Class<E> type;

    protected ValueEnumConverter(Class<E> type) {
        this.type = type;
    }

    @Override
    public Integer convertToDatabaseColumn(E value) {
        return value == null ? null : value.value();
    }

    @Override
    public E convertToEntityAttribute(Integer column) {
        if (column == null) {
            return null;
        }
        return Arrays.stream(type.getEnumConstants())
                .filter(e -> e.value() == column)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Value " + column + " is not valid for " + type.getSimpleName()));
    }
}