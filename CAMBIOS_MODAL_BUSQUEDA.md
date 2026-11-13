# Cambios en Modal de Búsqueda de Documento

## Descripción
Mejorada la experiencia del usuario cuando busca un documento de identidad en el formulario de inscripción y encuentra resultados que no corresponden al usuario.

**URL afectada**: `https://localhost:5173/inscripcion/`

## Cambios realizados

### 1. **Frontend - InscripcionPublica.tsx**

#### Nueva función auxiliar (línea 174-179)
```typescript
const cerrarModalYLimpiarDocumento = () => {
  cerrarModalBusqueda()
  set('numeroDocumento', '')
}
```

**Qué hace**: Cierra el modal, limpia el documento y limpia el atleta seleccionado.

**Dónde se usa**:
- Botón "Buscar otro documento" (antes "Soy nuevo")
- Botón X del modal (cerrar)

#### Cambios en el Dialog (línea 811)
```typescript
// ANTES
<Dialog abierto={busquedaAbierta} titulo={t('forms.documentFound')} onCerrar={cerrarModalBusqueda}>

// AHORA
<Dialog abierto={busquedaAbierta} titulo={t('forms.documentFound')} onCerrar={cerrarModalYLimpiarDocumento}>
```

#### Cambios en el botón (línea 863-865)
```typescript
// ANTES
<Button type="button" variant="outline" onClick={cerrarModalBusqueda}>
  {t('forms.imNew')}
</Button>

// AHORA
<Button type="button" variant="outline" onClick={cerrarModalYLimpiarDocumento}>
  {t('forms.searchOtherDocument')}
</Button>
```

#### Fix: NodeJS.Timeout (línea 126)
```typescript
// ANTES (error de TypeScript)
const timeoutMensajeRef = useRef<NodeJS.Timeout | null>(null)

// AHORA (correcto)
const timeoutMensajeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

### 2. **i18n - Traducciones (3 idiomas)**

#### Spanish (forms-es.json)
```json
{
  "searchOtherDocument": "Buscar otro documento",
  "documentFoundHelp": "Si encuentras tu registro en la lista, selecciónalo para cargar todos tus datos. Si no es tu caso —por ejemplo, tu tipo de documento o nacionalidad son distintos—, presiona \"Buscar otro documento\" para intentar con otro número."
}
```

#### English (forms-en.json)
```json
{
  "searchOtherDocument": "Search another document",
  "documentFoundHelp": "If you find your record in the list, select it to load all your details. If that is not your case —for example, your document type or nationality are different—, press \"Search another document\" to try with another number."
}
```

#### Portuguese (forms-pt.json)
```json
{
  "searchOtherDocument": "Buscar outro documento",
  "documentFoundHelp": "Se encontrar seu registro na lista, selecione-o para carregar todos os seus dados. Se não for o seu caso —por exemplo, seu tipo de documento ou nacionalidade são diferentes—, pressione \"Buscar outro documento\" para tentar com outro número."
}
```

## Comportamiento antes vs después

### ANTES
1. Usuario escribe CI
2. Busca y encuentra resultado
3. Modal se abre con la lista
4. Si no es el usuario, presiona "Soy nuevo"
5. Modal se cierra pero **el textbox del documento sigue con el valor anterior**
6. Usuario debe borrar manualmente el documento para buscar otro

### AHORA
1. Usuario escribe CI
2. Busca y encuentra resultado
3. Modal se abre con la lista
4. Si no es el usuario, presiona "Buscar otro documento"
5. Modal se cierra **y el textbox se limpia automáticamente**
6. Usuario puede escribir inmediatamente un nuevo documento

**También**: Al presionar el botón X (cerrar) ahora también limpia el documento, no solo antes.

## Archivos modificados
- `src/AEspejo.Inscripciones.Web/src/paginas/InscripcionPublica.tsx` (3 cambios)
- `src/AEspejo.Inscripciones.Web/src/lib/i18n/locales/forms-es.json`
- `src/AEspejo.Inscripciones.Web/src/lib/i18n/locales/forms-en.json`
- `src/AEspejo.Inscripciones.Web/src/lib/i18n/locales/forms-pt.json`

## Testing

Para verificar los cambios:

1. Levantar frontend: `cd src/AEspejo.Inscripciones.Web && npm run dev`
2. Ir a: `https://localhost:5173/inscripcion/utch-demo` (o cualquier evento)
3. Escribir un CI que sepa que existe (ej: un CI de otro usuario)
4. Presionar "Buscar otro documento"
5. Verificar que:
   - El modal se cierra
   - El textbox de documento se limpia
   - Puede escribir inmediatamente otro documento sin limpiar manualmente

---

**Fecha**: 2026-10-07  
**Responsable**: Claude Code
