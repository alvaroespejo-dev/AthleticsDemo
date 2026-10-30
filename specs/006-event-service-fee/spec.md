# Feature Specification: Per-Event Service Fee

**Feature Branch**: `006-event-service-fee`

**Created**: 2026-10-06

**Status**: Implemented (pending review)

**Input**: "Each event reads the service fee from Configuration ("Monto por servicio (Bs)"). If I change
it today while an event has registrations in progress, that event must keep its own service fee,
independent of the Configuration it was created with."

## Current State (audit)

- `ConfiguracionSistema.MontoServicioCentavos` (global, default 400) is read live by
  `ServicioInscripcionPublica` (public event view and registration price) and by the admin pricing
  table (`SeccionModalidades.tsx`, `CuadroPrecios`).
- `Inscripcion.MontoCentavos` is already a snapshot, so already-created registrations keep their
  amount. What changes today when Configuration changes: the price shown and charged to **new**
  registrants of events in progress, the final price in the admin table, and the exact amount each
  per-price payment QR must carry (a QR generated for the old amount stops matching).
- The existing test `ConfiguracionApiTests` asserted the opposite behavior (global fee, applied
  immediately) and is superseded by this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Event keeps its own service fee (Priority: P1)

An administrator changes the global service fee. Existing events keep charging the fee they had; only
events created afterwards start with the new global value.

**Independent Test**: Create an event, raise the global fee, read the public event and register an
athlete: the price and the registration amount still use the old fee.

**Acceptance Scenarios**:

1. **Given** an event created with the global fee Bs 4, **When** the global fee changes to Bs 10,
   **Then** the public price and new registrations of that event still include Bs 4.
2. **Given** the global fee is Bs 10, **When** a new event is created without an explicit fee,
   **Then** the event stores Bs 10 as its own fee.
3. **Given** events that existed before this feature, **When** the system is upgraded, **Then** each
   stores the global fee that was active at upgrade time (no price changes at upgrade).

---

### User Story 2 - Edit the fee of a single event (Priority: P2)

An administrator edits the service fee in the event form. It affects only that event and only new
registrations; existing registrations keep their stored amount.

**Independent Test**: Update one event's fee; another event and old registrations are unchanged.

**Acceptance Scenarios**:

1. **Given** an event with registrations, **When** its fee is edited, **Then** existing registrations
   keep `MontoCentavos` and the pricing table and public price show the new fee.
2. **Given** an update request that omits the fee, **When** saved, **Then** the stored fee is kept.

### Edge Cases

- Changing the event fee invalidates payment QRs generated for the old final price; the form warns
  about it.
- Fee range stays Bs 0 to Bs 100 (same validation as Configuration).
- Each brand has its own API and database: the migration runs per database.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Evento` MUST store its own service fee in cents (`MontoServicioCentavos`).
- **FR-002**: On event creation, when no fee is given, the system MUST copy the current global fee.
- **FR-003**: The public event view, the registration amount and the admin pricing table MUST use the
  event's fee, never the live global value.
- **FR-004**: The migration MUST backfill existing events with the global fee active at upgrade time.
- **FR-005**: The event API MUST expose and accept the fee; omitting it on update keeps the stored value.
- **FR-006**: The Configuration page MUST state that the value applies to new events only.
- **FR-007**: Validation MUST be Bs 0 to Bs 100.

### Key Entities

- **Evento**: gains `MontoServicioCentavos`.
- **ConfiguracionSistema**: `MontoServicioCentavos` becomes the default for new events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Changing the global fee changes the price of 0 existing events.
- **SC-002**: 100% of new registrations use the fee stored on their event.

## Assumptions

- Registrations are never repriced retroactively.
- Editing an event fee is allowed after registrations exist (only new ones are affected).
