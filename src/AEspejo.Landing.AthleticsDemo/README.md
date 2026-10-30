# Landing pública de Atletics Demo

Sitio público de `ecotrailbolivia.com`. HTML/CSS/JS plano empaquetado con Vite, sin framework.
Se despliega a la Azure Static Web App `Atletics DemoWeb`
(`salmon-coast-0b3a4d310.7.azurestaticapps.net`) con `.github/workflows/deploy-ecotrailweb.yml`.

Antes vivía dentro de `AEspejo.Inscripciones.Web` como una segunda entrada del mismo build de
Vite. Se separó al agregar la segunda marca: ahora cada
sitio público tiene su dominio, su despliegue y su ritmo de cambio.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5174
```

Necesita un `.env.local` con la API y el SPA locales; los valores están en `.env.example`. A
diferencia del SPA, la landing **no** usa proxy: llama a la API por URL absoluta desde otro
origen, igual que en producción, para que los problemas de CORS aparezcan acá y no al desplegar.
El backend tiene que aceptar `http://localhost:5174` en `cors.origenes` (`application.yml` o variable de entorno).

## Consecuencias de vivir en otro dominio

- **La API se referencia por URL absoluta** (`VITE_API_URL`, otro dominio: el App Service). El
  panel/portal/inscripción (`VITE_APP_URL`), en cambio, vive en este mismo dominio (ver README de
  la raíz, sección Despliegue) — los enlaces a `/portal` y `/login` se arman igual en `script.js`
  a partir de `data-ruta-app`, para no repetir la URL en cada uno, pero ya no cruzan de origen.
- **El menú sigue sin distinguir si el atleta tiene sesión**, aunque ya no sea por la razón
  original: Auth0 guarda el token en `localStorage`, que es por origen, y antes la landing
  (`ecotrailbolivia.com`) y el SPA (`admin.ecotrailbolivia.com`) eran dominios distintos. Ahora
  comparten origen, así que técnicamente sí se podría leer la sesión desde acá — no se revisó
  como parte de este cambio, y el menú sigue mostrando un único «Portal del atleta» en lugar de
  alternar entre iniciar sesión, ver perfil y cerrar sesión; el portal resuelve solo cuál
  corresponde.

## Por qué no está en la solución

La landing es un proyecto npm independiente, con su propio ciclo de despliegue. No forma parte del
build del backend Java (`src/AEspejo.Inscripciones.Backend`).

## Estructura

```
index.html          única página del sitio
landing/styles.css  paleta en :root y todo el layout
landing/script.js   i18n (es/en/pt), menú móvil y arranque del calendario
public/             logo, favicon y staticwebapp.config.json (Vite los copia a dist/)
```

El calendario de eventos no está acá: viene de `src/landings-comun/eventos.js`, compartido con
la landing de Atletics Demo porque es el contrato con la API. Eso fija los nombres de clase del
bloque de eventos (`.event-card`, `.event-date`, `.event-arrow`, `.filter`, …), que esta
landing estiliza a su manera pero no puede renombrar.

La marca que se pide a la API está en la constante `MARCA` de `landing/script.js`: es lo que
hace que este sitio no muestre los eventos de Atletics Demo.
