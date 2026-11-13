# Feature Specification: Event Day Kit Delivery

**Feature Branch**: `003-event-day-kit-delivery`

**Created**: 2026-10-06

**Status**: Deferred. The delivery write side is not implemented, and it is not part of the interview demo (see `specs/007-backend-api/spec.md`, Scope).

**Input**: README phase 7 "Event day" (status: Pending).

## Current State

- **Working**: the `KitDelivery` entity, the read side in `RegistrationService` (`KitDelivered` flag, delivered and
  undelivered filter, delivered-kits counter), the `KitStaff` role, the operations policy, bib assignment and the
  public QR per registration.
- **Rule in place**: `PaymentService` refuses to revert a payment when a kit was delivered.
- **Not implemented yet**: the write side (register delivery, revert delivery, live board, staff search).
  *Design required.*
- The `KitDelivery` entity and `KitDeliveryRepository` exist. `PaymentService` already checks for a delivery.
  No delivery service, controller or board exists.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deliver a kit (Priority: P1)

Kit staff finds a registration (by scanned code, bib or name) and confirms the kit delivery, optionally noting who
picked it up.

**Why this priority**: It is the core operation of event day.

**Independent Test**: Register a delivery for a paid registration; verify that `KitDelivery` is created, the list
shows `KitDelivered`, and a second delivery is rejected.

**Acceptance Scenarios**:

1. **Given** a paid registration without delivery, **When** staff confirms, **Then** a `KitDelivery` is stored with
   the user, the timestamp and the delivery point.
2. **Given** a registration already delivered, **When** staff tries again, **Then** a conflict error shows who
   delivered it and when.
3. **Given** a registration that is not paid (pending, cancelled, expired), **When** staff tries to deliver, **Then**
   it is rejected with a clear reason. [NEEDS CLARIFICATION: can unpaid but pending registrations be delivered with
   a supervisor override?]

---

### User Story 2 - Live delivery board (Priority: P2)

A coordinator sees delivered and pending kits per modality and per delivery point, refreshed automatically.

**Independent Test**: Deliver several kits; the board counters match the database.

**Acceptance Scenarios**:

1. **Given** deliveries in progress, **When** the board refreshes, **Then** the totals update within 30 seconds.

---

### User Story 3 - Undo a delivery (Priority: P3)

An administrator reverts a wrongly registered delivery; the reversal is audited.

**Independent Test**: Undo a delivery and verify that the registration is pending delivery again and that an audit
entry exists.

**Acceptance Scenarios**:

1. **Given** a delivered kit, **When** an administrator reverts it, **Then** the `KitDelivery` is removed and the
   change appears in the audit records.

### Edge Cases

- Two staff members delivering the same registration at the same time (unique index on `RegistrationId`).
- Low connectivity at the venue. [NEEDS CLARIFICATION: is offline mode required?]
- A bib not yet assigned at delivery time.
- A third-party pickup, which requires the name of the person who picks up the kit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let staff with the operations role register a kit delivery once per registration.
- **FR-002**: The system MUST find registrations by public code, bib number, document number or name.
- **FR-003**: The system MUST reject deliveries for registrations that are not in a deliverable state.
- **FR-004**: The system MUST show a live board with delivered and pending counts per modality and delivery point.
- **FR-005**: Only administrators MUST be able to revert a delivery, and every change is audited.
- **FR-006**: The staff screen MUST be usable on a phone. [NEEDS CLARIFICATION: is QR scanning inside the app, with
  the camera, required?]

### Key Entities

- **KitDelivery**: one delivery per registration (unique). Existing entity.
- **Registration**: provides the state, the bib and the kit definition.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A delivery is registered in under 15 seconds from search to confirmation.
- **SC-002**: No registration can have two deliveries.
- **SC-003**: Board numbers match the database totals at all times (verified in tests).

## Assumptions

- Staff authenticate with the existing JWT login and the `KitStaff` role.
- Delivery points are free text for now.
