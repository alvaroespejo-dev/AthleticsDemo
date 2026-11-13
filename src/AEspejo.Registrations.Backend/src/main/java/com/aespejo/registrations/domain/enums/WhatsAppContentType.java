package com.aespejo.registrations.domain.enums;

/** Content type of a WhatsApp message. The numeric values are persisted as-is in the database. */
public enum WhatsAppContentType implements ValueEnum {
    Text(1),
    Image(2),
    Audio(3),
    Video(4),
    Document(5),
    Sticker(6),
    Location(7),
    Contact(8),
    Reaction(9),
    Button(10),
    Template(11),
    Unsupported(99);

    private final int value;

    WhatsAppContentType(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}