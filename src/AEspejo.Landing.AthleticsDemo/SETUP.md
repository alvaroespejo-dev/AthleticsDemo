# Setup del Landing Atletics Demo

## Configuración de desarrollo

### Variables de entorno

**IMPORTANTE:** El `.env.local` debe existir en este directorio para que el landing funcione localmente.

```bash
cp .env.example .env.local
```

### Puertos esperados (localhost)

| Servicio | Protocolo | Puerto | Notas |
|----------|-----------|--------|-------|
| **Backend API** | `http://` | 5183 | ⚠️ HTTP, **NO** HTTPS |
| **Frontend Panel** | `https://` | 5173 | Certificado autofirmado OK |
| **Landing** | `https://` | 5174 | Certificado autofirmado OK |

### Configuración correcta de `.env.local`

```env
# Backend - DEBE ser HTTP en localhost (el API no usa HTTPS en desarrollo)
VITE_API_URL=http://localhost:5183/api

# Frontend Panel - https (Vite con basicSsl plugin)
VITE_APP_URL=https://localhost:5173
```

### ¿Por qué HTTP para la API?

El backend (Spring Boot en `src/AEspejo.Inscripciones.Backend`) corre en HTTP en desarrollo local:
- Configurado en `src/main/resources/application.yml` (`server.port`)
- URL HTTP: `http://localhost:5183`

Si intentas usar `https://localhost:5183` en el `.env.local`, el landing hará fetch a HTTPS pero el backend **solo escucha en HTTP**, causando errores de conexión.

### Verificación

Una vez configurado, verifica que:

1. **Backend está activo**: `http://localhost:5183/api/publico/eventos?marca=ecotrail` devuelve JSON con eventos
2. **Landing obtiene eventos**: Al abrir `https://localhost:5174/#eventos` debería mostrar la lista de eventos (ignorar advertencia de certificado)

### Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "eventos could not be loaded" en la página | `.env.local` con HTTPS para API | Cambiar a `http://` en `VITE_API_URL` |
| Certificado inválido en navegador | Certificados autofirmados (normal) | Ignorar advertencia, continuar a sitio |
| Puerto 5174 en uso | Otro proceso usa el puerto | `netstat -ano \| grep 5174` y matar el proceso |
| Cambios en `.env.local` no se aplican | Vite está cacheado | Reiniciar `npm run dev` |

### Notas importantes

- El `.env.local` está en `.gitignore` (no se versionea)
- El `.env.example` es la plantilla (se versionea)
- El `.env.production` tiene URLs de producción (se versionea)
- **Siempre** usar `http://` para la API en desarrollo local
