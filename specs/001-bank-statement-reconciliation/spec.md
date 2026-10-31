# Feature Specification: Bank Statement Import and Payment Reconciliation

**Feature Branch**: `001-bank-statement-reconciliation`

**Created**: 2026-10-06

**Status**: Deferred. Not implemented, and not part of the interview demo (see `specs/007-backend-api/spec.md`, Scope).

**Input**: README phase 4 "Payments engine and reconciliation" (status: Pending).

## Current State

- **Working**: manual payments (`PaymentService`: register, revert and update), amount comparison
  (`AmountComparator`), surplus (`Payment.SurplusCents`), name similarity (`NameSimilarity`) and proof of payment
  upload.
- **Schema only**: `StatementImportBatch` (statement batch) and `StatementMovement` (statement row), with the enums
  `ReconciliationStatus`, `ReconciliationRule` and `PaymentSource.Statement` / `PaymentSource.Webhook`.
- **Not implemented yet**: the matching engine, the statement parser, the review queue and batch undo. These need
  their design approved before any code is written (*design required*).
- No statement service, controller or parser exists.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import a bank statement (Priority: P1)

A cashier uploads a bank statement file, selects the bank profile, and sees how many rows were read, imported and
ignored. Every row is stored, reconciled or not.

**Why this priority**: Without imported movements no automatic reconciliation is possible.

**Independent Test**: Upload a sample statement; verify a batch is created with correct counts and one
`StatementMovement` per valid row, with the original row preserved.

**Acceptance Scenarios**:

1. **Given** a valid statement and a known bank profile, **When** the cashier uploads it, **Then** a batch is
   created and all movements are stored as `Pending`.
2. **Given** a row with no amount or date, **When** importing, **Then** it is counted as ignored with a reason and
   is never silently dropped.
3. **Given** a transaction number that already exists in `Payments`, **When** importing, **Then** the movement is
   stored and flagged, and no duplicate payment is created.

---

### User Story 2 - Automatic and suggested reconciliation (Priority: P1)

After import the system links movements to registrations: exact matches create the payment automatically; weaker
matches become suggestions that wait for one-click confirmation.

**Why this priority**: This is the core value of the phase: it removes manual payment entry.

**Independent Test**: Seed registrations and a statement covering each rule; verify the resulting
`ReconciliationStatus`, `ReconciliationRule` and the created payments.

**Acceptance Scenarios**:

1. **Given** a movement whose transaction number matches a registration, **When** reconciling, **Then** a payment
   with source `Statement` is created and the registration state is recalculated.
2. **Given** a movement with an amount equal to a pending registration and a similar payer name, **When**
   reconciling, **Then** it is marked `Suggested` with a similarity score, and no payment is created until it is
   confirmed.
3. **Given** an overpayment, **When** reconciling, **Then** the surplus is stored in `SurplusCents`.

---

### User Story 3 - Review queue and manual actions (Priority: P2)

An operator reviews the suggestions ordered by score, and confirms, links manually to another registration, or
discards a movement.

**Independent Test**: Confirm, relink and discard one movement each; verify the states and the audit entries.

**Acceptance Scenarios**:

1. **Given** a suggestion, **When** the operator confirms it, **Then** the state becomes `AutoReconciled` and a
   payment is created with the rule `AmountAndPayer`.
2. **Given** an unmatched movement, **When** the operator links it manually, **Then** the rule is `Manual`.
3. **Given** a movement, **When** it is discarded, **Then** the state is `Discarded` with a reason.

---

### User Story 4 - Undo an import batch (Priority: P3)

An administrator undoes a whole batch. The payments created by it are removed and the registration states are
recalculated.

**Independent Test**: Import, reconcile and undo; verify that no payments from the batch remain.

**Acceptance Scenarios**:

1. **Given** a batch with reconciled movements, **When** it is undone, **Then** its payments are deleted, the states
   are recalculated, and the batch is marked as undone in the audit log.

### Edge Cases

- The same statement uploaded twice (idempotency by transaction number).
- An amount mismatch (under or over) on registrations that are already `Paid`, `Cancelled`, `Refunded` or `Expired`.
- Several registrations match the same amount and a similar payer name.
- Dates in different time zones (stored as UTC).
- Large files (row limit and size limit).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST import statements for the supported bank profiles and store every row with its
  original content.
- **FR-002**: The system MUST reconcile by transaction number (rule `TransactionNumber`) and create a payment with
  source `Statement`.
- **FR-003**: The system MUST propose matches by amount plus similar payer (rule `AmountAndPayer`) and require
  operator confirmation.
- **FR-004**: The system MUST prevent duplicate payments through the unique `TransactionNumber` index.
- **FR-005**: The system MUST record surplus amounts instead of discarding them.
- **FR-006**: The system MUST allow manual link, discard and batch undo, all audited.
- **FR-007**: The endpoints MUST be restricted to the cashier policy (undo: administrator policy).
- **FR-008**: The admin panel MUST expose the import, the reconciliation queue and the batch history.
- **FR-009**: The system MUST support bank profiles. [NEEDS CLARIFICATION: which banks and file formats (CSV or
  XLSX) are required? The examples in the entity documentation are only examples.]
- **FR-010**: The rule by transaction number requires a transaction number from the athlete. [NEEDS
  CLARIFICATION: the proof-of-payment upload does not store a transaction number. Should the public form and the
  upload capture it?]
- **FR-011**: Webhook payments (`PaymentSource.Webhook`) are [NEEDS CLARIFICATION: in scope or a later phase?].
  They are assumed to be out of scope here.

### Key Entities

- **StatementImportBatch**: one uploaded statement, with its counts and bank profile.
- **StatementMovement**: one statement row, with its state, rule, suggested registration and score.
- **Payment**: money credited to a registration. Its source is `Statement` when this feature creates it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A cashier reconciles a 500-row statement in under 5 minutes of hands-on time.
- **SC-002**: At least 80% of movements with a valid transaction number are reconciled without human action.
- **SC-003**: Zero duplicate payments are created when the same statement is uploaded twice.
- **SC-004**: Every automatic payment can be traced to its statement row and rule.

## Assumptions

- A single currency, with amounts in integer cents.
- The existing roles and policies are reused; no new roles.
- Files are processed synchronously for the expected volume (hundreds of rows).
