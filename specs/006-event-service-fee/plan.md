# Implementation Plan: Per-Event Service Fee

**Branch**: `006-event-service-fee` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

## Summary

Add `Event.serviceFeeCents`, copied from Configuration at creation (same pattern already used
for `WaiverText`), backfilled by the migration, exposed in the event DTOs, and used by the public
registration service and the admin pricing table instead of the global value.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / Next.js (panel)

**Storage**: SQLite (default) or PostgreSQL via JPA (Hibernate); one migration `AddEventServiceFee` with a backfill

**Testing**: JUnit integration tests

**Project Type**: web application

## Constitution Check

- II Layers: entity in Domain, copy-on-create in `EventService`, no provider-specific code. PASS.
- III Data: integer cents; backfill uses engine-neutral SQL (`UPDATE ... SELECT`). PASS.
- IV Validation: Bean Validation `@Min(0) @Max(10_000)` on the request. PASS.
- VI Frontend: new field in the event form, i18n keys in es/en/pt. PASS.
- VII Testing: integration tests for independence, copy-on-create and update. PASS.
- I Language: new code and docs in English. PASS.

## Changes

```text
domain/entities/Event.java                          + serviceFeeCents
src/main/resources/db/migration/*           + AddEventServiceFee (with backfill)
application/catalog/EventModels.java                       event detail and save models (Integer serviceFeeCents)
application/catalog/EventService.java           copy on create, update when provided, map
application/catalog/PublicEventService.java    use the event's serviceFeeCents (no settings dependency)
src/AEspejo.Registrations.Frontend/src/api/types.ts                              event detail and save types
src/AEspejo.Registrations.Frontend (event form)              fee input
src/AEspejo.Registrations.Frontend (modalities section)     use the event's fee, not the global query
src/AEspejo.Registrations.Frontend/src/lib/i18n/locales/*  new keys (es, en, pt) and Settings help text
settings and fee integration tests                updated for the new behavior
```

## Contracts

`GET/POST/PUT /api/events`: `serviceFeeCents` added to the detail response. On `POST`/`PUT`
the field is optional (`int?`): `POST` omitted -> copy global; `PUT` omitted -> keep stored value.
Backward compatible (additive).

## Risks

- QRs per final price must be regenerated after changing an event's fee (warning in the form).