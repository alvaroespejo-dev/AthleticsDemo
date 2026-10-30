# Tasks: Historical Athlete Import

**Input**: [spec.md](spec.md), [plan.md](plan.md). Port rules: [007 spec](../007-java-backend-port/spec.md).

## Phase 1: Clarification

- [ ] T001 Obtain anonymized sample files; resolve FR-008 and FR-009; update spec.md
- [ ] T002 Decide the undo strategy (batch marker vs. derive from rows) and update plan.md

## Phase 2: Foundational (includes ports from C#)

- [ ] T003 Port `SimilitudNombres` to `NameSimilarity` (spec 007 T003)
- [ ] T004 Port `ValidadorDocumento` to `DocumentValidator`, with tests from the C# unit tests
- [ ] T005 [P] `AthleteFileReader` interface and CSV implementation
- [ ] T006 [P] `ImportFileValidator` (content-based validation)
- [ ] T007 `ImportRowClassifier` pure rules in `domain/services`
- [ ] T008 [P] Unit tests for the classifier covering the five outcomes
- [ ] T009 Migration for undo bookkeeping if required

## Phase 3: US1 - Preview (P1) MVP

- [ ] T010 [US1] `AthleteImportService.preview` (no writes)
- [ ] T011 [US1] Preview endpoint and integration tests
- [ ] T012 [US1] Upload, mapping and preview wizard in `ImportacionAtletas.tsx`; i18n in es, en and pt

## Phase 4: US2 - Process batch (P1)

- [ ] T013 [US2] `AthleteImportService.process` creating athletes and registrations with opt-in source `Imported`
- [ ] T014 [US2] Equivalence resolution through `ModalityEquivalence`
- [ ] T015 [US2] Integration tests: all outcomes, idempotent re-upload, no consent recorded

## Phase 5: US3 - Review queue (P2)

- [ ] T016 [US3] Equivalence CRUD endpoints
- [ ] T017 [US3] Row resolve, reprocess and manual merge endpoints
- [ ] T018 [P] [US3] Review queue UI in the panel

## Phase 6: US4 - Undo (P3)

- [ ] T019 [US4] `undo` with safety checks and audit
- [ ] T020 [US4] Integration test for undo

## Phase 7: Polish

- [ ] T021 Update README; document the import procedure
- [ ] T022 `./mvnw verify` and panel `npm run build` pass
