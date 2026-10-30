# Implementation Plan: Engineering Quality Baseline

**Branch**: `005-quality-baseline` | **Spec**: [spec.md](spec.md) | **Port**: [007](../007-java-backend-port/plan.md)

## Summary

Add repository-level quality tooling for the Java backend and the shared panel: a formatter and lint setup
for Java, coverage reporting, Vitest and React Testing Library for the panel, and a pull-request CI workflow
that runs both backends' checks. No product code changes.

## Reference and target

| Concern | C# reference (`AEspejo.InscripcionesBackupCSharp`) | Java target |
|---|---|---|
| Style rules | `.editorconfig` absent; `Directory.Build.props` absent | `.editorconfig` at repository root; formatter plugin in `pom.xml` (to choose) |
| Build checks | `dotnet format --verify-no-changes` (not in CI) | `./mvnw verify` runs format check and tests |
| Coverage | coverlet (not published) | JaCoCo report in `target/site/jacoco`, published as CI artifact |
| Frontend tests | none | Vitest and React Testing Library in the panel (`src/AEspejo.Inscripciones.Web`) |
| Lint | `oxlint` (not in CI) | same, `npm run lint` |

## Technical Context

**Language/Version**: Java 21, Maven wrapper; Node.js 22+ (panel)

**Primary Dependencies**: JaCoCo, a Java formatter plugin (to choose), Vitest, `@testing-library/react`, jsdom

**Storage**: N/A

**Testing**: JUnit 5 (backend), Vitest (panel)

**Target Platform**: GitHub Actions (`ubuntu-latest` for both)

**Constraints**: do not break existing deploy workflows; the PR workflow is separate.

## Constitution Check

- Testing and quality TBD items resolved by this feature. PASS.
- Language: configuration and docs in English; Java sources use English identifiers. PASS.

## Project Structure

```text
specs/005-quality-baseline/{spec.md, plan.md, tasks.md}

.editorconfig                                             (root, Java, TypeScript, Markdown)
src/AEspejo.Inscripciones.Backend/pom.xml                 (formatter and JaCoCo plugins)
src/AEspejo.Inscripciones.Web/package.json                (test script, devDependencies)
src/AEspejo.Inscripciones.Web/vite.config.ts              (test block) or vitest.config.ts
src/AEspejo.Inscripciones.Web/src/api/endpoints.test.ts   (adapter tests, see spec 007)
src/AEspejo.Inscripciones.Web/src/auth/RutaProtegida.test.tsx
.github/workflows/pr-checks.yml
```

**Structure Decision**: a separate PR workflow so deployment workflows stay untouched.

## Contracts

None (no API changes).

## Risks

- The first formatter run touches many Java files; do it in one isolated commit.
- Vite and React 19 compatibility with jsdom: verify versions before adopting.
- The panel tests must also cover the Java adapter (spec 007 section 4), otherwise route changes go unnoticed.
