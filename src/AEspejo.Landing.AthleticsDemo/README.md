# Landing pública de Atletics Demo

Sitio público de la demo. HTML/CSS/JS empaquetado con Vite, sin framework. Muestra el calendario de eventos
publicados de la API, con el enlace de inscripción y el acceso al portal del atleta y al panel.

El despliegue (Azure Static Web App) todavía no está configurado para esta demo. Antes de publicarla, hay que
cambiar .env.production (la API y el dominio de la app) y crear el workflow de despliegue.

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

- **La API se referencia por URL absoluta** (VITE_API_URL). El panel y la inscripción se leen de VITE_APP_URL.
- **El menú muestra un único «Portal del atleta»**. El portal decide si hay sesión y muestra el inicio de sesión, el perfil o el alta según corresponda.

## Por qué no está en la solución

La landing es un proyecto npm independiente, con su propio ciclo de despliegue. No forma parte del
build del backend Java (`src/AEspejo.Registrations.Backend`).

## Estructura

```text
index.html            única página del sitio
landing/main.js     i18n (es/en), menú, idioma y arranque del calendario
landing/styles.css   paleta en :root y todo el layout
landing/motion.css   animaciones e imágenes de la portada
landing/eventos.js   calendario de eventos (contrato con la API)
public/              logo, favicon y staticwebapp.config.json (Vite los copia a dist/)
```

El calendario se carga desde landing/eventos.js. Es el contrato con la API, así que fija los nombres de
clase del bloque de eventos (.event-card, .event-date, .event-arrow, .filter, …).

La marca que se pide a la API está en landing/main.js, en la configuración de crearCalendario.
