import { crearCalendario } from './eventos.js'

// Textos de la landing en los dos idiomas. Las claves de `data-i18n` del HTML y las que pide
// el calendario compartido (`textos()` en landing/eventos.js) viven en el mismo objeto.
const TEXTOS = {
  es: {
    brand: 'Carreras urbanas',
    navDistances: 'Distancias',
    navHow: 'Cómo funciona',
    navCalendar: 'Calendario',
    navCompanies: 'Empresas',
    navMoneySport: 'Athlete Portal',
    adminAccess: 'Acceso admin',
    heroEyebrow: 'Carreras en la ciudad',
    heroTitle: 'Corre por <em>tu</em> ciudad',
    heroCopy: 'Circuitos cerrados, cronometraje por chip y hidratación en ruta, para tu primera carrera de 5K o tu primer 21K.',
    heroCta: 'Ver próximas carreras',
    heroSecondary: 'Elegir distancia',
    statDistances: 'Distancias',
    statChip: 'Cronometraje por chip',
    statQueues: 'Colas en la entrega de kits',
    distancesTitle: 'Elige tu distancia',
    distancesCopy: 'Tres recorridos por circuito cerrado. Empieza por el que te haga sentir desafiado, no por el que te asusta.',
    distance5: 'Tu primera carrera. Plana, corta y con ambiente de familia.',
    distance10: 'Para quien ya entrena con regularidad y quiere medir su ritmo.',
    distance21: 'Media maratón urbana, con avituallamiento cada cinco kilómetros.',
    howTitle: 'Cómo funciona',
    step1Title: 'Inscríbete en línea',
    step1Copy: 'Elige la carrera, la categoría y la talla de tu kit desde el calendario.',
    step2Title: 'Retira tu kit',
    step2Copy: 'Entrega de kits con puntos de atención separados, sin filas largas.',
    step3Title: 'Corre con chip',
    step3Copy: 'Tu tiempo se registra desde el primer segundo y se publica al terminar.',
    calendarTitle: 'Calendario',
    filterUpcoming: 'Próximas',
    filterPast: 'Pasadas',
    loadingEvents: 'Cargando carreras…',
    companiesTitle: '¿Organizas una carrera para tu empresa o club?',
    companiesCopy: 'Nos encargamos de la producción completa: permisos, circuito, cronometraje, inscripciones en línea y premiación.',
    companiesCta: 'Escríbenos',
    footerNote: 'Sitio de demostración',
    footerPhotos: 'Fotos: Ben Stern y Spencer Imbrock, vía Unsplash',
    marqueeChip: 'Cronometraje por chip',
    marqueeCircuit: 'Circuito cerrado',
    bandCaption: 'Corre entre edificios, no entre filas.',
    // Claves que usa el calendario compartido.
    upcomingEvent: 'Próxima',
    pastEvent: 'Pasada',
    finished: 'Finalizada',
    registrationClosed: 'Inscripciones cerradas',
    register: 'Inscribirme',
    registerFor: 'Inscribirse a',
    noPublishedEvents: 'Todavía no hay carreras publicadas.',
    loadEventsError: 'No se pudo cargar el calendario. Intenta de nuevo más tarde.',
  },
  en: {
    brand: 'Urban races',
    navDistances: 'Distances',
    navHow: 'How it works',
    navCalendar: 'Calendar',
    navCompanies: 'Companies',
    navMoneySport: 'Athlete Portal',
    adminAccess: 'Admin access',
    heroEyebrow: 'Races in the city',
    heroTitle: 'Run through <em>your</em> city',
    heroCopy: 'Closed circuits, chip timing and on-course hydration, for your first 5K or your first 21K.',
    heroCta: 'See upcoming races',
    heroSecondary: 'Choose a distance',
    statDistances: 'Distances',
    statChip: 'Chip timing',
    statQueues: 'No queues at kit pickup',
    distancesTitle: 'Choose your distance',
    distancesCopy: 'Three closed-circuit routes. Start with the one that challenges you, not the one that scares you.',
    distance5: 'Your first race. Flat, short and friendly.',
    distance10: 'For runners who already train regularly and want to measure their pace.',
    distance21: 'An urban half marathon, with water stations every five kilometres.',
    howTitle: 'How it works',
    step1Title: 'Register online',
    step1Copy: 'Pick the race, your category and your kit size from the calendar.',
    step2Title: 'Collect your kit',
    step2Copy: 'Separate pickup points, so there are no long lines.',
    step3Title: 'Run with chip timing',
    step3Copy: 'Your time is recorded from the first second and published when you finish.',
    calendarTitle: 'Calendar',
    filterUpcoming: 'Upcoming',
    filterPast: 'Past',
    loadingEvents: 'Loading races…',
    companiesTitle: 'Organising a race for your company or club?',
    companiesCopy: 'We handle the full production: permits, course, timing, online registration and awards.',
    companiesCta: 'Contact us',
    footerNote: 'Demo site',
    footerPhotos: 'Photos: Ben Stern and Spencer Imbrock, via Unsplash',
    marqueeChip: 'Chip timing',
    marqueeCircuit: 'Closed circuit',
    bandCaption: 'Run between buildings, not in lines.',
    upcomingEvent: 'Upcoming',
    pastEvent: 'Past',
    finished: 'Finished',
    registrationClosed: 'Registration closed',
    register: 'Register',
    registerFor: 'Register for',
    noPublishedEvents: 'No races have been published yet.',
    loadEventsError: 'The calendar could not be loaded. Please try again later.',
  },
}

const idiomaGuardado = localStorage.getItem('idioma')
let idioma = idiomaGuardado === 'es' ? 'es' : 'en'

function aplicarIdioma(nuevo) {
  idioma = nuevo
  document.documentElement.lang = nuevo
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const clave = el.dataset.i18n
    const texto = TEXTOS[nuevo][clave]
    if (texto === undefined) return
    if (clave === 'heroTitle') {
      el.innerHTML = texto
    } else {
      el.textContent = texto
    }
  })
  document.getElementById('idioma').value = nuevo
  try {
    localStorage.setItem('idioma', nuevo)
  } catch {
    // Sin almacenamiento el idioma solo dura hasta recargar la página.
  }
}

// La app del panel y el formulario viven en VITE_APP_URL. Las rutas son las de la app Next:
// /register/{slug} para inscribirse, /login para el panel y /athlete-portal para el portal del atleta.
const appUrl = import.meta.env.VITE_APP_URL

document.getElementById('enlace-admin').href = `${appUrl}/login/`
document.getElementById('enlace-money-sport').href = `${appUrl}/athlete-portal/`

const calendario = crearCalendario({
  apiUrl: import.meta.env.VITE_API_URL,
  appUrl,
  // Vacío: el backend devuelve los eventos publicados de todas las marcas.
  marca: '',
  textos: () => TEXTOS[idioma],
  construirEnlace: (evento) => `${appUrl}/register/${evento.slug}/`,
})

document.getElementById('idioma').addEventListener('change', (evento) => {
  aplicarIdioma(evento.target.value)
  calendario.cargar()
})

const botonMenu = document.getElementById('menu-toggle')
botonMenu.addEventListener('click', () => {
  const abierto = document.getElementById('menu').classList.toggle('open')
  botonMenu.setAttribute('aria-expanded', String(abierto))
})

// Revelado de bloques al entrar en pantalla. Sin JavaScript el contenido queda visible.
document.documentElement.classList.add('js')
const revelar = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible')
        revelar.unobserve(entrada.target)
      }
    })
  },
  { threshold: 0.15 },
)
document.querySelectorAll('.reveal-up').forEach((el) => revelar.observe(el))

aplicarIdioma(idioma)
calendario.cargar()
