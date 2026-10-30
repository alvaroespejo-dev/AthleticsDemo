package com.aespejo.registrations.infrastructure.security;

/**
 * Authorization rules of the API, ported from {@code Politicas} in the C# reference. Use them with
 * {@code @PreAuthorize}. The role comes from the {@code role} claim of the token, mapped to {@code ROLE_<role>}.
 */
public final class Policies {

    /** Administrators only: catalog, users and settings. */
    public static final String ADMIN = "hasRole('Admin')";

    /** Administrators and cashiers: payments and registrations. */
    public static final String CASH = "hasAnyRole('Admin','Cashier')";

    /** Staff of the event day, plus administrators and cashiers: check-in, bibs and results. */
    public static final String OPERATIONS = "hasAnyRole('Admin','Cashier','KitStaff')";

    /** Any authenticated user, including read-only accounts: reports and lists. */
    public static final String READ = "isAuthenticated()";

    private Policies() {
    }
}
