# Feature Specification: Bank Statement Import and Payment Reconciliation

**Feature Branch**: `001-bank-statement-reconciliation`

**Created**: 2026-10-06

**Status**: Deferred. Not in the C# reference and not part of the interview demo (see `specs/007-java-backend-port/spec.md`, Scope).

**Input**: README phase 4 "Payments engine and reconciliation" (status: Pending).

## Current State (audit)

- **C# reference (`AEspejo.InscripcionesBackupCSharp/src`)**:
  - Working: manual payments (`ServicioPagos.RegistrarAsync`, `RevertirAsync`, `ActualizarAsync`),
    amount rule (`ComparadorMontos`), surplus (`Pago.ExcedenteCentavos`), name similarity
    (`SimilitudNombres`), proof-of-payment (`ServicioComprobantePago`).
  - Entities only: `LoteImportacionExtracto` (statement batch), `MovimientoExtracto` (statement row),
    `EstadoConciliacion`, `ReglaConciliacion`, `OrigenPago.Extracto/Webhook`, with EF configuration
    in `ConciliacionConfigurations.cs`.
  - **Not in C#**: the matching engine, statement parser, review queue, batch undo. There is no C#
    code to port for these; they are *design required*.
- **Java target (`src/AEspejo.Inscripciones.Backend`)**: `PaymentService` exists (with known differences,
  see spec 007 `plan.md` section 7). `StatementImportBatch` and `StatementMovement` entities exist.
  No statement service, controller or parser exists.
- Missing in both: statement import, matching rules, suggestion queue, undo of a batch.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import a bank statement (Priority: P1)

A cashier uploads a bank statement file, selects the bank profile, and sees how many rows were read,
imported and ignored. Every row is stored, reconciled or not.

**Why this priority**: Without imported movements no automatic reconciliation is possible.

**Independent Test**: Upload a sample statement; verify a batch is created with correct counts and
one `MovimientoExtracto` per valid row, with the original row preserved.

**Acceptance Scenarios**:

1. **Given** a valid statement and a known bank profile, **When** the cashier uploads it, **Then** a
   batch is created and all movements are stored as `Pendiente`.
2. **Given** a row with no amount or date, **When** importing, **Then** it is counted as ignored with
   a reason and is never silently dropped.
3. **Given** a transaction number that already exists in `Pago`, **When** importing, **Then** the
   movement is stored but flagged and no duplicate payment is created.

---

### User Story 2 - Automatic and suggested reconciliation (Priority: P1)

After import the system links movements to registrations: exact matches create the payment
automatically; weaker matches become suggestions awaiting a one-click confirmation.

**Why this priority**: This is the core value of the phase (removes manual payment entry).

**Independent Test**: Seed registrations and a statement covering each rule; verify resulting
`EstadoConciliacion`, `ReglaConciliacion` and created `Pago` records.

**Acceptance Scenarios**:

1. **Given** a movement whose transaction number matches a registration, **When** reconciling,
   **Then** a `Pago` with origin `Extracto` is created and the registration state is recalculated.
2. **Given** a movement with amount equal to a pending registration and a similar payer name,
   **When** reconciling, **Then** it is marked `ConciliadoSugerido` with a similarity score and no
   payment is created until confirmed.
3. **Given** an overpayment, **When** reconciling, **Then** the surplus is stored in
   `ExcedenteCentavos`.

---

### User Story 3 - Review queue and manual actions (Priority: P2)

An operator reviews suggestions ordered by score, confirms, links manually to another registration,
or discards a movement.

**Independent Test**: Confirm, relink and discard one movement each; verify states and audit entries.

**Acceptance Scenarios**:

1. **Given** a suggestion, **When** the operator confirms, **Then** state becomes `ConciliadoSugerido`
   -> payment created with rule `MontoYOrdenante`.
2. **Given** an unmatched movement, **When** the operator links it manually, **Then** rule is `Manual`.
3. **Given** a movement, **When** discarded, **Then** state is `Descartado` with a reason.

---

### User Story 4 - Undo an import batch (Priority: P3)

An administrator undoes a whole batch; payments created by it are removed and registration states
are recalculated.

**Independent Test**: Import, reconcile, undo; verify no payments from the batch remain.

**Acceptance Scenarios**:

1. **Given** a batch with reconciled movements, **When** undone, **Then** its payments are deleted,
   states recalculated and the batch marked as undone in the audit log.

### Edge Cases

- Same statement uploaded twice (idempotency by transaction number).
- Amount mismatch (under/over) and registrations already `Pagada`, `Anulada`, `Reembolsada`, `Expirada`.
- Several registrations match the same amount and a similar payer name.
- Dates in different time zones (persist UTC).
- Large files (row limit and size limit).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST import statements for the supported bank profiles and store every row with
  its original content.
- **FR-002**: System MUST reconcile by transaction number (rule `NumeroTransaccion`) and create a
  `Pago` with origin `Extracto`.
- **FR-003**: System MUST propose matches by amount plus similar payer (rule `MontoYOrdenante`) and
  require operator confirmation.
- **FR-004**: System MUST prevent duplicate payments through the unique `NumeroTransaccion` index.
- **FR-005**: System MUST record surplus amounts instead of discarding them.
- **FR-006**: System MUST allow manual link, discard and batch undo, all audited (`IAuditable`).
- **FR-007**: Endpoints MUST be restricted to the `caja` policy (undo: `administracion`).
- **FR-008**: The admin UI MUST expose import, reconciliation queue and batch history.
- **FR-009**: System MUST support bank profiles [NEEDS CLARIFICATION: which banks and file formats
  (CSV/XLSX) are required? Entity docs mention `bnb` and `banco-union` as examples only].
- **FR-010**: Rule 1 requires an athlete-declared transaction number [NEEDS CLARIFICATION: the
  current proof-of-payment upload does not store a transaction number; should the public form and
  `ServicioComprobantePago` capture it?].
- **FR-011**: Webhook/dynamic QR payments (`OrigenPago.Webhook`) are [NEEDS CLARIFICATION: in scope
  or a later phase?]. Assumed out of scope here.

### Key Entities

- **LoteImportacionExtracto**: one uploaded statement, with counts and bank profile.
- **MovimientoExtracto**: one statement row, state, rule, suggested registration and score.
- **Pago**: money credited to a registration; origin `Extracto` when created by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A cashier reconciles a 500-row statement in under 5 minutes of hands-on time.
- **SC-002**: At least 80% of movements with a valid transaction number are reconciled without human action.
- **SC-003**: Zero duplicate payments are created when the same statement is uploaded twice.
- **SC-004**: Every automatic payment can be traced to its statement row and rule.

## Assumptions

- Single currency; amounts in integer cents (constitution III).
- Existing roles and policies are reused; no new roles.
- Files are processed synchronously for the expected volume (hundreds of rows).
