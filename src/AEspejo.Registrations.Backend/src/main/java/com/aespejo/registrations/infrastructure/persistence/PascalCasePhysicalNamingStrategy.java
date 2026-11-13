package com.aespejo.registrations.infrastructure.persistence;

import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.naming.PhysicalNamingStrategy;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

/**
 * Maps Java names to the PascalCase schema defined in {@code V1__initial_schema.sql}. For example,
 * {@code phone_e164} becomes {@code "PhoneE164"}. Identifiers are always quoted, so the database does
 * not fold them to lowercase. Used by both SQLite and PostgreSQL.
 */
public class PascalCasePhysicalNamingStrategy implements PhysicalNamingStrategy {

    @Override
    public Identifier toPhysicalCatalogName(Identifier name, JdbcEnvironment environment) {
        return toPascalCase(name);
    }

    @Override
    public Identifier toPhysicalSchemaName(Identifier name, JdbcEnvironment environment) {
        return toPascalCase(name);
    }

    @Override
    public Identifier toPhysicalTableName(Identifier name, JdbcEnvironment environment) {
        return toPascalCase(name);
    }

    @Override
    public Identifier toPhysicalSequenceName(Identifier name, JdbcEnvironment environment) {
        return toPascalCase(name);
    }

    @Override
    public Identifier toPhysicalColumnName(Identifier name, JdbcEnvironment environment) {
        return toPascalCase(name);
    }

    private static Identifier toPascalCase(Identifier original) {
        if (original == null) {
            return null;
        }
        StringBuilder pascal = new StringBuilder();
        for (String part : original.getText().split("_")) {
            if (!part.isEmpty()) {
                pascal.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
            }
        }
        return Identifier.toIdentifier(pascal.toString(), true);
    }
}
