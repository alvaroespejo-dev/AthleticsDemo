# Implementation Plan: Event Day Kit Delivery

**Branch**: `003-event-day-kit-delivery` | **Spec**: [spec.md](spec.md)

## Summary

Add the write side for kit delivery in Java: a `KitDeliveryService` use case, staff endpoints restricted
to the `KitStaff` role, a summary endpoint for the live board, and a mobile-first page in the panel that
polls the summary. The read side and the revert rule already exist; the write side is *design required*.

## Target

| Concern | Java target |
| --- | --- |
| Entity | `domain/entities/KitDelivery.java` (exists) |
| Read side, `KitDelivered` flag, filter, counter | `application/registration/RegistrationService.java` (to extend) |
| Revert rule (kit delivered blocks payment revert) | `application/payment/PaymentService.java` (exists; `kitDeliveries.existsByRegistrationId`) |
| Delivery write, search, summary | `application/kitdelivery/KitDeliveryService.java` (design required) |

## UI (panel)

- The navigation lists **Día del evento** (route `/dia-evento`, visible to every authenticated role). No route
  for `/dia-evento` exists yet, so the item leads nowhere.
- The registrant detail screen has a read-only section **Entrega del kit** with labels `detail.kitDelivery`,
  `detail.delivered`, `detail.handledBy` (who attended) and `detail.pickedUpBy` (who collected). The write side
  must fill these fields.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / Next.js (panel)

**Primary Dependencies**: Spring Data JPA; TanStack Query in the panel (polling with `refetchInterval`)

**Storage**: PostgreSQL; unique index on `KitDeliveries.RegistrationId` (add a migration if missing)

**Testing**: JUnit 5 and `@SpringBootTest` integration tests

**Target Platform**: Spring Boot server; phones as clients

**Constraints**: the unique index is the concurrency guard for double delivery.

## Constitution Check

- Layers: use case in `application/kitdelivery`, controller in `api`. PASS.
- Auditing: `KitDelivery` is audited like the other entities. PASS.
- Errors: `ConflictException` for double delivery, `BusinessRuleException` for non-deliverable state. PASS.
- Security: `KitStaff` for delivery; `Admin` for revert. PASS.
- Language: English names and routes. PASS.

## Project Structure (new files)

```text
src/AEspejo.Registrations.Backend/src/main/java/com/aespejo/registrations/
  application/kitdelivery/KitDeliveryService.java
  application/kitdelivery/KitDeliveryModels.java
  api/kitdelivery/KitDeliveryController.java
src/AEspejo.Registrations.Frontend/src/features/kit-delivery/   (new page)
src/test/java/.../KitDeliveryApiTest.java
```

## Contracts (English routes)

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/api/events/{eventId}/kit-deliveries/search?q=` | KitStaff, Admin | Find by code, bib, document or name |
| POST | `/api/registrations/{id}/kit-delivery` | KitStaff, Admin | Register delivery |
| DELETE | `/api/registrations/{id}/kit-delivery` | Admin | Revert delivery |
| GET | `/api/events/{eventId}/kit-deliveries/summary` | KitStaff, Admin | Board counters |

## Data Model

Existing `KitDelivery` entity. Migration only if the unique index on `RegistrationId` is missing, and an
index to speed up search by bib.

## Risks

- Offline mode (spec edge case) would change the architecture; the plan assumes online only.
- Override for unpaid registrations needs a product decision (US1 scenario 3).
- No delivery write path exists yet, so the rules must be specified before coding.