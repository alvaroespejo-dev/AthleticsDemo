# Feature Specification: Event Day Kit Delivery

**Feature Branch**: `003-event-day-kit-delivery`

**Created**: 2026-10-06

**Status**: Deferred. The delivery write side is not in the C# reference and is not part of the interview demo (see `specs/007-java-backend-port/spec.md`, Scope).

**Input**: README phase 7 "Event day" (status: Pending).

## Current State (audit)

- **C# reference (`AEspejo.InscripcionesBackupCSharp/src`)**:
  - Working: `EntregaKit` entity (`Domain/Entities/EntregaKit.cs`), the read side in
    `ServicioAdminInscripciones` (`KitEntregado` flag, delivered/undelivered filter, `KitsEntregados`
    counter), role `StaffKits`, policy `Operacion`, bib assignment, public QR per registration.
  - Rule in C#: `ServicioPagos.RevertirAsync` refuses to revert a payment when a kit was delivered.
  - Not in C#: the write side (register delivery, revert delivery, live board, search for staff).
    *Design required.*
- **Java target**: `KitDelivery` entity and `KitDeliveryRepository` exist; `PaymentService` already
  checks `existsByRegistrationId`. No delivery service, controller or board exists.
- Missing in both: delivery write, staff search by code, live dashboard, mobile screen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deliver a kit (Priority: P1)

Kit staff finds a registration (by scanned code, bib or name) and confirms the kit delivery,
optionally noting who picked it up.

**Why this priority**: It is the core operation of event day.

**Independent Test**: Register a delivery for a paid registration; verify `EntregaKit` is created,
the list shows `KitEntregado`, and a second delivery is rejected.

**Acceptance Scenarios**:

1. **Given** a paid registration without delivery, **When** staff confirms, **Then** an `EntregaKit`
   is stored with user, timestamp and delivery point.
2. **Given** a registration already delivered, **When** staff tries again, **Then** a conflict error
   shows who delivered it and when.
3. **Given** a registration that is not paid (pending, cancelled, expired), **When** staff tries to
   deliver, **Then** it is rejected with a clear reason [NEEDS CLARIFICATION: can unpaid-but-pending
   registrations be delivered with a supervisor override?].

---

### User Story 2 - Live delivery board (Priority: P2)

A coordinator sees delivered vs. pending kits per modality and per delivery point, refreshed
automatically.

**Independent Test**: Deliver several kits; the board counters match the database.

**Acceptance Scenarios**:

1. **Given** deliveries in progress, **When** the board refreshes, **Then** totals update within 30 seconds.

---

### User Story 3 - Undo a delivery (Priority: P3)

An administrator reverts a wrongly registered delivery; the reversal is audited.

**Independent Test**: Undo a delivery and verify the registration is again pending delivery and an
audit entry exists.

**Acceptance Scenarios**:

1. **Given** a delivered kit, **When** an administrator reverts it, **Then** `EntregaKit` is removed
   and the change appears in `RegistroAuditoria`.

### Edge Cases

- Two staff members delivering the same registration simultaneously (unique index on `InscripcionId`).
- Low connectivity at the venue [NEEDS CLARIFICATION: is offline mode required?].
- Bib not assigned yet at delivery time.
- Third-party pickup requires `RetiradoPor`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let `Operacion` roles register a kit delivery once per registration.
- **FR-002**: System MUST find registrations by public code, bib number, document number or name.
- **FR-003**: System MUST reject deliveries for registrations not in a deliverable state.
- **FR-004**: System MUST show a live board with delivered/pending counts per modality and delivery point.
- **FR-005**: Only administrators MUST be able to revert a delivery; every change is audited.
- **FR-006**: The staff screen MUST be usable on a phone [NEEDS CLARIFICATION: QR scanning inside the app via camera?].

### Key Entities

- **EntregaKit**: one delivery per registration (unique), existing entity.
- **Inscripcion**: provides state, bib and kit definition.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A delivery is registered in under 15 seconds from search to confirmation.
- **SC-002**: No registration can have two deliveries.
- **SC-003**: Board numbers match database totals at all times (verified in tests).

## Assumptions

- Staff authenticate with the existing JWT login and role `StaffKits`.
- Delivery points are free text (`PuntoEntrega`) for now.
