import { crearCalendario } from './eventos.js'

// La landing vive en su propio dominio (ecotrailbolivia.com, una Azure Static Web App), así
// que la API y el formulario de inscripción se referencian por URL absoluta. Ver .env.production.
const API_URL = import.meta.env.VITE_API_URL
const APP_URL = import.meta.env.VITE_APP_URL
const MARCA = 'ecotrail'

// Menú móvil.
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const selectorIdioma = document.getElementById('selector-idioma');
let idiomaActual = 'es';

const traducciones = {
  es: { home: 'Inicio', about: 'Nosotros', experiences: 'Experiencias', events: 'Eventos', contact: 'Contacto', portal: 'Portal del atleta', adminAccess: 'Acceso admin', menu: 'Abrir menú', heroEyebrow: 'Bolivia, territorio de aventura', heroTitle: 'Corre hacia', heroTitleEmphasis: 'lo extraordinario.', heroCopy: 'Diseñamos experiencias deportivas que te llevan más lejos. Montañas, senderos y comunidades que se quedan contigo.', heroEvents: 'Ver próximos eventos', heroAbout: 'Conoce ECOTRAIL', heroNote: 'Explora<br>sin límites', scroll: 'Desliza para explorar', introEyebrow: 'Más que una carrera', introTitle: 'El camino es', introTitleEmphasis: 'la experiencia.', introLead: 'En Atletics Demo creemos que el deporte es una forma de descubrir el mundo y descubrirte a ti mismo.', introCopy: 'Organizamos carreras, travesías y encuentros en escenarios únicos de Bolivia. Cada kilómetro está pensado para conectar a las personas con la naturaleza, la cultura y las personas que hacen especial cada destino.', introLink: 'Nuestra forma de hacerlo', statAdventures: 'Aventuras<br>activas', statPassion: 'Pasión por<br>el territorio', statPaths: 'Caminos por<br>descubrir', servicesEyebrow: 'Lo que hacemos', servicesTitle: 'Vive el movimiento.', servicesCopy: 'Del primer paso a la meta: creamos eventos con propósito, organización y una mirada profundamente local.', serviceRacesTitle: 'Carreras<br>de montaña', serviceRacesCopy: 'Desafíos para todos los niveles en rutas que revelan la belleza de Bolivia.', serviceRacesLink: 'Descubrir eventos', serviceTourismTitle: 'Turismo<br>deportivo', serviceTourismCopy: 'Viajes activos para explorar paisajes, cultura y comunidades de forma diferente.', serviceTourismLink: 'Planear experiencia', servicePurposeTitle: 'Eventos<br>con propósito', servicePurposeCopy: 'Producimos encuentros deportivos memorables, responsables y bien organizados.', servicePurposeLink: 'Trabajemos juntos', calendarEyebrow: 'Calendario ECOTRAIL', calendarTitle: 'Elige tu próximo', calendarTitleEmphasis: 'horizonte.', upcoming: 'Próximos', past: 'Pasados', loadingEvents: 'Cargando eventos…', quoteEyebrow: 'Tu próxima historia comienza aquí', quoteFirst: '“No coleccionamos medallas.', quoteSecond: 'Coleccionamos momentos.', quoteLink: 'Encuentra tu evento', contactEyebrow: 'Hagamos algo grande', contactTitle: '¿Tienes una', contactTitleEmphasis: 'idea en mente?', contactCopy: 'Cuéntanos qué imaginas. Estamos listos para convertirlo en una experiencia que mueva a las personas y cuide el lugar que nos recibe.', contactEmail: 'Escríbenos' },
  en: { home: 'Home', about: 'About us', experiences: 'Experiences', events: 'Events', contact: 'Contact', portal: 'Athlete portal', adminAccess: 'Admin access', menu: 'Open menu', heroEyebrow: 'Bolivia, land of adventure', heroTitle: 'Run toward', heroTitleEmphasis: 'the extraordinary.', heroCopy: 'We design sports experiences that take you farther. Mountains, trails, and communities that stay with you.', heroEvents: 'View upcoming events', heroAbout: 'Discover ECOTRAIL', heroNote: 'Explore<br>without limits', scroll: 'Scroll to explore', introEyebrow: 'More than a race', introTitle: 'The journey is', introTitleEmphasis: 'the experience.', introLead: 'At Atletics Demo, we believe sport is a way to discover the world and yourself.', introCopy: 'We organize races, treks, and gatherings in unique Bolivian settings. Every kilometer connects athletes with nature, culture, and the people who make each destination special.', introLink: 'Our way of doing it', statAdventures: 'Active<br>adventures', statPassion: 'Passion for<br>the land', statPaths: 'Paths to<br>discover', servicesEyebrow: 'What we do', servicesTitle: 'Live the movement.', servicesCopy: 'From the first step to the finish line: purposeful events, thoughtful organization, and a deeply local perspective.', serviceRacesTitle: 'Mountain<br>races', serviceRacesCopy: 'Challenges for every level on routes that reveal Bolivia’s beauty.', serviceRacesLink: 'Discover events', serviceTourismTitle: 'Sports<br>tourism', serviceTourismCopy: 'Active trips to explore landscapes, culture, and communities differently.', serviceTourismLink: 'Plan an experience', servicePurposeTitle: 'Purposeful<br>events', servicePurposeCopy: 'We produce memorable, responsible, and well-organized sports gatherings.', servicePurposeLink: 'Let’s work together', calendarEyebrow: 'ECOTRAIL calendar', calendarTitle: 'Choose your next', calendarTitleEmphasis: 'horizon.', upcoming: 'Upcoming', past: 'Past', loadingEvents: 'Loading events…', quoteEyebrow: 'Your next story starts here', quoteFirst: '“We do not collect medals.', quoteSecond: 'We collect moments.', quoteLink: 'Find your event', contactEyebrow: 'Let’s make something great', contactTitle: 'Have an', contactTitleEmphasis: 'idea in mind?', contactCopy: 'Tell us what you imagine. We are ready to turn it into an experience that moves people and cares for the place that welcomes us.', contactEmail: 'Write to us' },
  pt: { home: 'Início', about: 'Sobre nós', experiences: 'Experiências', events: 'Eventos', contact: 'Contato', portal: 'Portal do atleta', adminAccess: 'Acesso admin', menu: 'Abrir menu', heroEyebrow: 'Bolívia, território de aventura', heroTitle: 'Corra rumo ao', heroTitleEmphasis: 'extraordinário.', heroCopy: 'Criamos experiências esportivas que levam você mais longe. Montanhas, trilhas e comunidades que ficam com você.', heroEvents: 'Ver próximos eventos', heroAbout: 'Conheça a ECOTRAIL', heroNote: 'Explore<br>sem limites', scroll: 'Deslize para explorar', introEyebrow: 'Mais que uma corrida', introTitle: 'O caminho é', introTitleEmphasis: 'a experiência.', introLead: 'Na Atletics Demo, acreditamos que o esporte é uma forma de descobrir o mundo e a si mesmo.', introCopy: 'Organizamos corridas, travessias e encontros em cenários únicos da Bolívia. Cada quilômetro conecta atletas à natureza, à cultura e às pessoas que tornam cada destino especial.', introLink: 'Nossa forma de fazer', statAdventures: 'Aventuras<br>ativas', statPassion: 'Paixão pelo<br>território', statPaths: 'Caminhos para<br>descobrir', servicesEyebrow: 'O que fazemos', servicesTitle: 'Viva o movimento.', servicesCopy: 'Do primeiro passo à linha de chegada: eventos com propósito, organização e um olhar profundamente local.', serviceRacesTitle: 'Corridas<br>de montanha', serviceRacesCopy: 'Desafios para todos os níveis em rotas que revelam a beleza da Bolívia.', serviceRacesLink: 'Descobrir eventos', serviceTourismTitle: 'Turismo<br>esportivo', serviceTourismCopy: 'Viagens ativas para explorar paisagens, cultura e comunidades de um jeito diferente.', serviceTourismLink: 'Planejar experiência', servicePurposeTitle: 'Eventos<br>com propósito', servicePurposeCopy: 'Produzimos encontros esportivos memoráveis, responsáveis e bem organizados.', servicePurposeLink: 'Vamos trabalhar juntos', calendarEyebrow: 'Calendário ECOTRAIL', calendarTitle: 'Escolha seu próximo', calendarTitleEmphasis: 'horizonte.', upcoming: 'Próximos', past: 'Passados', loadingEvents: 'Carregando eventos…', quoteEyebrow: 'Sua próxima história começa aqui', quoteFirst: '“Não colecionamos medalhas.', quoteSecond: 'Colecionamos momentos.', quoteLink: 'Encontre seu evento', contactEyebrow: 'Vamos fazer algo grande', contactTitle: 'Você tem uma', contactTitleEmphasis: 'ideia em mente?', contactCopy: 'Conte o que você imagina. Estamos prontos para transformar isso em uma experiência que mova pessoas e cuide do lugar que nos recebe.', contactEmail: 'Escreva para nós' },
};

Object.assign(traducciones.es, {
  introCopy: 'Organizamos carreras, travesías y encuentros en escenarios únicos de Bolivia. Cada kilómetro está pensado para conectar a las personas con la naturaleza, la cultura y la esencia que hace especial cada destino.',
  heroBrand: 'Atletics Demo Especialistas en turismo deportivo',
  contactEyebrow: 'Hagamos algo grande', contactTitle: '¿Tienes una', contactTitleEmphasis: 'idea en mente?',
  contactPrompt: 'Contáctate con nosotros', contactCopy: 'Cuéntanos qué imaginas. Estamos listos para convertirlo en una experiencia que mueva a las personas y cuide el lugar que nos recibe.', contactEmail: 'Escríbenos',
  footerTagline: 'Atletics Demo Especialistas en turismo deportivo', footerFollow: 'Síguenos', footerInstagram: 'Instagram', footerFacebook: 'Facebook', footerAccess: 'Accesos', footerPortal: 'Portal del atleta', footerAdmin: 'Administración de eventos ↗', footerCopyright: '© 2026 Atletics Demo', footerMade: 'Hecho para explorar.'
});
Object.assign(traducciones.en, {
  introCopy: 'We organize races, treks, and gatherings in unique Bolivian settings. Every kilometer is designed to connect people with nature, culture, and the essence that makes each destination special.',
  heroBrand: 'Atletics Demo Specialists in sports tourism',
  contactEyebrow: 'Let’s create something great', contactTitle: 'Do you have an', contactTitleEmphasis: 'idea in mind?',
  contactPrompt: 'Contact us', contactCopy: 'Tell us what you have in mind. We are ready to turn it into an experience that moves people and respects the place that welcomes us.', contactEmail: 'Write to us',
  footerTagline: 'Atletics Demo Specialists in sports tourism', footerFollow: 'Follow us', footerInstagram: 'Instagram', footerFacebook: 'Facebook', footerAccess: 'Access', footerPortal: 'Athlete portal', footerAdmin: 'Event administration ↗', footerCopyright: '© 2026 Atletics Demo', footerMade: 'Made to explore.'
});
Object.assign(traducciones.pt, {
  introCopy: 'Organizamos corridas, travessias e encontros em cenários únicos da Bolívia. Cada quilômetro foi pensado para conectar as pessoas com a natureza, a cultura e a essência que torna cada destino especial.',
  heroBrand: 'Atletics Demo Especialistas em turismo esportivo',
  contactEyebrow: 'Vamos fazer algo grande', contactTitle: 'Você tem uma', contactTitleEmphasis: 'ideia em mente?',
  contactPrompt: 'Entre em contato conosco', contactCopy: 'Conte-nos o que você imagina. Estamos prontos para transformar isso em uma experiência que mova as pessoas e cuide do lugar que nos recebe.', contactEmail: 'Escreva para nós',
  footerTagline: 'Atletics Demo Especialistas em turismo esportivo', footerFollow: 'Siga-nos', footerInstagram: 'Instagram', footerFacebook: 'Facebook', footerAccess: 'Acessos', footerPortal: 'Portal do atleta', footerAdmin: 'Administração de eventos ↗', footerCopyright: '© 2026 Atletics Demo', footerMade: 'Feito para explorar.'
});

const textosCalendario = {
  es: { pastEvent: 'Evento pasado', upcomingEvent: 'Próximo evento', finished: 'Finalizado', registrationClosed: 'Inscripciones cerradas', registerFor: 'Inscribirme en', register: 'Inscribirme', noPublishedEvents: 'Todavía no hay eventos publicados.', loadEventsError: 'No se pudieron cargar los eventos. Intenta recargar la página.' },
  en: { pastEvent: 'Past event', upcomingEvent: 'Upcoming event', finished: 'Finished', registrationClosed: 'Registration closed', registerFor: 'Register for', register: 'Register', noPublishedEvents: 'There are no published events yet.', loadEventsError: 'Events could not be loaded. Try reloading the page.' },
  pt: { pastEvent: 'Evento passado', upcomingEvent: 'Próximo evento', finished: 'Finalizado', registrationClosed: 'Inscrições encerradas', registerFor: 'Inscrever-se em', register: 'Inscrever-se', noPublishedEvents: 'Ainda não há eventos publicados.', loadEventsError: 'Não foi possível carregar os eventos. Tente recarregar a página.' },
};

const calendario = crearCalendario({
  apiUrl: API_URL,
  appUrl: APP_URL,
  marca: MARCA,
  // Enlace corto propio del dominio de la landing (ver redirect.html y
  // staticwebapp.config.json): más fácil de compartir que la URL larga del SPA.
  construirEnlace: (evento) => `/inscripciones/${evento.slug}`,
  textos: () => ({
    ...traducciones[idiomaActual] ?? traducciones.es,
    ...textosCalendario[idiomaActual] ?? textosCalendario.es,
  }),
});

function aplicarIdioma(idioma) {
  idiomaActual = traducciones[idioma] ? idioma : 'es';
  const textos = { ...traducciones[idiomaActual], ...textosCalendario[idiomaActual] };
  document.documentElement.lang = idioma;
  document.querySelectorAll('[data-i18n]').forEach((elemento) => {
    const clave = elemento.dataset.i18n;
    if (textos[clave]) elemento.textContent = textos[clave];
  });
  document.querySelectorAll('[data-i18n-html]').forEach((elemento) => {
    const clave = elemento.dataset.i18nHtml;
    if (textos[clave]) elemento.innerHTML = textos[clave];
  });
  const fijos = {
    '.hero-brand': 'heroBrand',
    '.contact .eyebrow span:last-child': 'contactEyebrow',
    '.contact h2': 'contactTitle',
    '.contact-prompt': 'contactPrompt',
    '.contact .lead': 'contactCopy',
    '.contact .button-dark span:first-child': 'contactEmail',
    '.site-footer .footer-grid > div:first-child p': 'footerTagline',
    '.site-footer .footer-grid > div:nth-child(2) .footer-label': 'footerFollow',
    '.site-footer .footer-grid > div:nth-child(2) .socials a:first-child': 'footerInstagram',
    '.site-footer .footer-grid > div:nth-child(2) .socials a:nth-child(2)': 'footerFacebook',
    '.site-footer .footer-grid > div:nth-child(3) .footer-label': 'footerAccess',
    '.site-footer .footer-grid > div:nth-child(3) a:first-of-type': 'footerPortal',
    '.site-footer .footer-grid > div:nth-child(3) a:last-of-type': 'footerAdmin',
    '.site-footer .footer-bottom span:first-child': 'footerCopyright',
    '.site-footer .footer-bottom span:last-child': 'footerMade',
  };
  Object.entries(fijos).forEach(([selector, clave]) => {
    const elemento = document.querySelector(selector);
    if (elemento && textos[clave]) {
      if (selector === '.contact h2') {
        elemento.innerHTML = `${textos.contactTitle}<br /><em>${textos.contactTitleEmphasis}</em>`;
      } else {
        elemento.textContent = textos[clave];
      }
    }
  });
  const menu = document.querySelector('[data-i18n-aria="menu"]');
  menu?.setAttribute('aria-label', textos.menu);
  localStorage.setItem('aespejo.lang', idiomaActual);
  if (document.getElementById('lista-eventos')?.children.length) calendario.cargar();
}

const idiomaGuardado = localStorage.getItem('aespejo.lang');
const idiomaInicial = traducciones[idiomaGuardado] ? idiomaGuardado : 'es';
selectorIdioma.value = idiomaInicial;
aplicarIdioma(idiomaInicial);
selectorIdioma.addEventListener('change', (evento) => aplicarIdioma(evento.target.value));

// Los enlaces al portal y al panel apuntan al SPA, que vive en otro dominio (ver APP_URL).
// Se resuelven acá y no en el HTML para no repetir el dominio en cada enlace.
//
// La marca y el origen viajan en la URL porque el SPA es uno solo para las dos landings: hoy
// las dos apuntan al mismo host (localhost:5173 en desarrollo, la misma Static Web App en
// producción), así que el SPA no puede deducir la marca del dominio. Ver marcaActual() y
// urlDeVuelta() en src/lib/marca.ts del SPA.
document.querySelectorAll('[data-ruta-app]').forEach((enlace) => {
  const url = new URL(`${APP_URL}${enlace.dataset.rutaApp}`);
  url.searchParams.set('marca', MARCA);
  url.searchParams.set('volver', location.origin);
  enlace.href = url.toString();
});

// Actualizar links a Money Sport para que usen el dominio correcto (APP_URL) en lugar de localhost.
const moneySportUrl = new URL('/moneysport', APP_URL).toString();
document.querySelectorAll('a[data-i18n="moneySport"]').forEach((enlace) => {
  enlace.href = moneySportUrl;
});

menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

calendario.cargar();
