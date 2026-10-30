# Implementation Plan: Per-Event Service Fee

**Branch**: `006-event-service-fee` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

## Summary

Add `Evento.MontoServicioCentavos`, copied from Configuration at creation (same pattern already used
for `TextoDeslinde`), backfilled by the migration, exposed in the event DTOs, and used by the public
registration service and the admin pricing table instead of the global value.

## Technical Context

**Language/Version**: C# on .NET 10; TypeScript 6 / React 19

**Storage**: SQLite via EF Core 10.0.10; one migration `AgregarMontoServicioEvento` with a backfill

**Testing**: xUnit integration tests (`ConfiguracionApiTests` rewritten)

**Project Type**: web application

## Constitution Check

- II Layers: entity in Domain, copy-on-create in `ServicioEventos`, no provider-specific code. PASS.
- III Data: integer cents; backfill uses engine-neutral SQL (`UPDATE ... SELECT`). PASS.
- IV Validation: DataAnnotations `Range(0, 10_000)`. PASS.
- VI Frontend: new field in `FormularioEvento`, i18n keys in es/en/pt. PASS.
- VII Testing: integration tests for independence, copy-on-create and update. PASS.
- I Language: new code and docs in English. PASS.

## Changes

```text
Domain/Entities/Evento.cs                         + MontoServicioCentavos
Infrastructure/Persistence/Migrations/*           + AgregarMontoServicioEvento (with backfill)
Application/Catalogo/DtosCatalogo.cs              EventoDetalleDto + GuardarEventoDto (int? MontoServicioCentavos)
Application/Catalogo/ServicioEventos.cs           copy on create, update when provided, map
Application/Inscripciones/ServicioInscripcionPublica.cs   use evento.MontoServicioCentavos (drop ServicioConfiguracion dependency)
Web/src/api/tipos.ts                              EventoDetalle / GuardarEvento fields
Web/src/paginas/FormularioEvento.tsx              fee input
Web/src/paginas/SeccionModalidades.tsx            use the event's fee, not the global query
Web/src/lib/i18n/locales/*                        new keys (es, en, pt) and Configuration help text
tests/.../ConfiguracionApiTests.cs                rewritten for the new behavior
```

## Contracts

`GET/POST/PUT api/eventos`: `montoServicioCentavos` added to the detail response. On `POST`/`PUT`
the field is optional (`int?`): `POST` omitted -> copy global; `PUT` omitted -> keep stored value.
Backward compatible (additive).

## Risks

- QRs per final price must be regenerated after changing an event's fee (warning in the form).
