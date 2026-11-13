# Tasks: Bank Statement Import and Payment Reconciliation

**Input**: [spec.md](spec.md), [plan.md](plan.md).

**Status legend**: `[ ]` not started. Nothing is done until verified by tests.

## Phase 1: Clarification (blocking)

- [ ] T001 Resolve FR-009, FR-010, FR-011 with the product owner and update spec.md
- [ ] T002 Obtain one real (anonymized) statement per supported bank for fixtures
- [ ] T003 Approve the matching rules (rule 1 transaction number, rule 3 amount plus payer similarity) in writing,
      because no matching engine exists yet

## Phase 2: Foundational

- [ ] T004 Define `StatementFileReader` interface in `application/statement`
- [ ] T005 [P] Implement `ReconciliationRules` (pure) in `domain/services`; `ReconciliationRulesTest` in `src/test/java`
- [ ] T006 [P] Implement `AmountComparator` and `NameSimilarity` (tests included) if not done yet
- [ ] T007 Add Flyway migration `V2__statement_undo.sql` only if undo columns are required

## Phase 3: US1 - Import statement (P1) MVP

- [ ] T008 [US1] Implement the first bank reader in `infrastructure/statement`
- [ ] T009 [US1] `StatementReconciliationService.importBatch` stores batch and movements
- [ ] T010 [US1] `StatementController` import and history endpoints, role `Cashier`/`Admin`
- [ ] T011 [US1] Integration tests: valid file, bad rows, duplicate transaction number

## Phase 4: US2 - Reconciliation (P1)

- [ ] T012 [US2] Run rules during import; create payments through `PaymentService.register`
- [ ] T013 [US2] Integration tests per rule, surplus and ineligible registration states

## Phase 5: US3 - Review queue (P2)

- [ ] T014 [US3] Confirm, link and discard endpoints and service methods
- [ ] T015 [P] [US3] Panel page `ReconciliationPage.tsx`, its route, nav entry and calls in `endpoints.ts`
- [ ] T016 [P] [US3] Spanish, English and Portuguese strings in the panel i18n files (backend keys stay in English)

## Phase 6: US4 - Undo batch (P3)

- [ ] T017 [US4] `undoBatch` with state recalculation and audit; endpoint restricted to `Admin`
- [ ] T018 [US4] Integration test: import, reconcile, undo

## Phase 7: Polish

- [ ] T019 Update README and operations notes
- [ ] T020 `./mvnw verify` passes; panel `npm run build` passes