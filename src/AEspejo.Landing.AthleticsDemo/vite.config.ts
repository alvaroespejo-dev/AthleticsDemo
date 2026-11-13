import { defineConfig, type Plugin } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'node:path'

// Enlace corto de inscripción (/inscripciones/{slug}): en producción, staticwebapp.config.json
// reescribe /inscripciones/* a /redirect.html sin cambiar la URL que ve el navegador. El dev
// server de Vite no lee ese archivo, así que se reproduce la misma reescritura acá para que
// `npm run dev` se comporte igual que Azure Static Web Apps.
function reescribirEnlaceCorto(): Plugin {
  return {
    name: 'reescribir-enlace-corto',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/inscripciones/')) {
          req.url = '/redirect.html'
        }

        next()
      })
    },
  }
}

// Landing pública de Atletics Demo. Se publica como Azure Static Web
// App, independiente del App Service que sirve la API y el SPA: un cambio de copy no
// redespliega el backend.
//
// Es un sitio de una sola página HTML sin framework, así que no hace falta un plugin de framework.
export default defineConfig({
  plugins: [basicSsl(), reescribirEnlaceCorto()],
  server: {
    port: 5175,
    https: {},
    // Falla claro si el puerto está tomado en vez de saltar a otro: el origen que la API
    // tiene en Cors:Origenes quedaría apuntando al lugar equivocado sin que se note.
    strictPort: true,
    fs: {
      // Permite servir archivos fuera de la raíz del proyecto; sin esto el dev server se niega
      // a servirlo. En `build` no hace falta: Rollup resuelve el import relativo igual.
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // redirect.html es un segundo entry, no una ruta de un router: sin declararlo acá,
      // `vite build` solo empaqueta index.html y el archivo no llega a dist/.
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        redirect: path.resolve(import.meta.dirname, 'redirect.html'),
      },
    },
  },
})
