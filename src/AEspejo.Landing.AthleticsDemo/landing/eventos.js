// Calendario de eventos de las landings.
//
// Es lo único que comparten los dos sitios públicos (la landing de Atletics Demo y
// la landing de Atletics Demo), y a propósito: el diseño, los textos y la marca de cada uno son
// independientes, pero esto es el contrato con la API. Duplicarlo garantizaría que una de las
// dos marcas se rompa en silencio el día que cambie EventoPublicoResumenDto.

const MESES_ABREV = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// FechaEvento llega como "yyyy-MM-dd" (DateOnly): se parsea a mano para no arrastrar
// desfases de zona horaria con `new Date(string)`.
function parsearFecha(fechaIso) {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return { anio, mes, dia, valor: new Date(anio, mes - 1, dia) }
}

function esPasado(fechaIso) {
  const { valor } = parsearFecha(fechaIso)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return valor < hoy
}

/**
 * Monta el calendario de una landing.
 *
 * @param {object} opciones
 * @param {string} opciones.apiUrl   Base de la API, ej.
 *                                   `https://ecotrailapi-ejbratdkehczbpf9.canadacentral-01.azurewebsites.net/api`.
 *                                   Absoluta porque la landing y la API viven en dominios
 *                                   distintos: la landing es una Static Web App y la API un
 *                                   App Service.
 * @param {string} opciones.appUrl   Base del panel/portal, ej. `https://www.ecotrailbolivia.com`
 *                                   (mismo dominio que esta landing). De ahí cuelga el
 *                                   formulario de inscripción.
 * @param {string} opciones.marca    Código de marca, ej. `ecotrail`. Sin esto la landing
 *                                   listaría también los eventos de la otra marca.
 * @param {() => object} opciones.textos  Devuelve los textos del idioma activo. Es una función
 *                                   y no un objeto porque el idioma cambia en caliente.
 * @param {(evento: object) => string} [opciones.construirEnlace]  Arma el href del botón
 *                                   "Inscribirse" a partir del evento. Por omisión es
 *                                   `${appUrl}/inscripcion/{slug}`; Atletics Demo lo reemplaza por
 *                                   un enlace corto propio (`/i/{slug}`, ver
 *                                   el redirect.html de la landing de Atletics Demo) para no tener
 *                                   que compartir la URL larga del SPA.
 * @returns {{ cargar: () => Promise<void> }}
 */
export function crearCalendario({ apiUrl, appUrl, marca, textos, construirEnlace }) {
  const enlaceInscripcion = construirEnlace ?? ((evento) => `${appUrl}/inscripcion/${evento.slug}`)

  function crearTarjeta(evento) {
    const { anio, mes, dia } = parsearFecha(evento.eventDate)
    const pasado = esPasado(evento.eventDate)
    const estado = pasado ? 'past' : 'upcoming'

    const article = document.createElement('article')
    article.className = `event-card ${estado}`
    article.dataset.state = estado

    const t = textos()
    const etiqueta = pasado ? t.pastEvent : t.upcomingEvent
    const lugar = evento.location ? `${evento.location} <span>•</span> ` : ''
    const fechaLarga = `${dia} de ${MESES_LARGOS[mes - 1]}, ${anio}`

    let acciones
    if (pasado) {
      acciones = `<span class="event-status">${t.finished}</span>`
    } else if (!evento.registrationOpen) {
      acciones = `<span class="event-status">${evento.closedReason ?? t.registrationClosed}</span>`
    } else {
      acciones = `<a class="event-arrow" href="${enlaceInscripcion(evento)}" target="_blank" rel="noopener noreferrer" aria-label="${t.registerFor} ${evento.name}">${t.register} <span>↗</span></a>`
    }

    // Miniatura cuadrada de 200px. Sin imagen se deja el recuadro vacío, con el mismo tamaño
    // reservado, para que las tarjetas no salten de alto entre sí.
    //
    // La imagen entra por <img> y no por fetch: así no necesita CORS aunque la API esté en
    // otro dominio.
    const miniatura = evento.hasImage
      ? `<img src="${apiUrl}/public/events/${evento.slug}/image" alt="" loading="lazy" />`
      : ''

    article.innerHTML = `
      <div class="event-date"><strong>${dia}</strong><span>${MESES_ABREV[mes - 1]}<br />${anio}</span></div>
      <div class="event-thumb">${miniatura}</div>
      <div class="event-info">
        <span class="event-tag">${etiqueta}</span>
        <h3>${evento.name}</h3>
        <p>${lugar}${fechaLarga}</p>
      </div>
      ${acciones}
    `

    return article
  }

  // Filtro Próximos/Pasados. Se reengancha en cada render porque las tarjetas se recrean.
  function activarFiltros() {
    document.querySelectorAll('.filter').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        const state = button.dataset.filter
        document.querySelectorAll('.event-card').forEach((event) => {
          event.classList.toggle('is-visible', event.dataset.state === state)
        })
      })
    })
  }

  async function cargar() {
    const lista = document.getElementById('lista-eventos')
    if (!lista) return

    const t = textos()

    try {
      const respuesta = await fetch(`${apiUrl}/public/events?brand=${marca}`)
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

      const eventos = await respuesta.json()

      const proximos = eventos
        .filter((e) => !esPasado(e.eventDate))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      const pasados = eventos
        .filter((e) => esPasado(e.eventDate))
        .sort((a, b) => b.eventDate.localeCompare(a.eventDate))

      document.getElementById('conteo-proximos').textContent = String(proximos.length)
      document.getElementById('conteo-pasados').textContent = String(pasados.length)

      lista.innerHTML = ''

      if (eventos.length === 0) {
        lista.innerHTML = `<p class="event-status">${t.noPublishedEvents}</p>`
        return
      }

      ;[...proximos, ...pasados].forEach((evento) => lista.appendChild(crearTarjeta(evento)))

      document.querySelectorAll('.event-card.upcoming').forEach((event) => event.classList.add('is-visible'))
      activarFiltros()
    } catch {
      lista.innerHTML = `<p class="event-status">${t.loadEventsError}</p>`
    }
  }

  return { cargar }
}
