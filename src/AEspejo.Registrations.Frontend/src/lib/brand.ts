/**
 * Visual identity per brand.
 *
 * The same code serves every brand: each brand is built once (`build:ecotrail` / `build:onesport`,
 * each with its own `.env.<brand>`) and served next to its landing page on the same domain. Logo,
 * accent colour and the "back to landing" link are still resolved per brand at runtime, so a single
 * component can serve both builds without branching on the environment.
 *
 * There are three ways to know which brand a screen belongs to, and they are not interchangeable:
 *
 * - Where there is an event (the public registration form), the brand comes from the event itself
 *   (`PublicEvent.brand`). That is the reliable source: a link to /register/{slug} can arrive from any
 *   domain, including an e-mail or a WhatsApp message.
 * - Where there is no event but the user came from a landing page (login and athlete portal), the
 *   landing passes the brand in the query string (`currentBrand()`, fed by `recordBrandContext()`).
 * - When neither applies (the panel was opened directly), the brand is derived from the hostname
 *   with `brandFromHost()`, which recognises both the brand's own domain and the shared
 *   *.azurestaticapps.net host behind the Static Web App.
 */

import { withBasePath } from '@/lib/base-path'

export interface Brand {
  code: string
  name: string
  /** Short name used in phrases such as "Back to {{brand}}" in the athlete portal. */
  shortName: string
  /** Title of the athlete portal login screen and of the browser tab while it is shown. */
  portalTitle: string
  /** Title of the admin panel login screen and of the browser tab while it is shown. */
  adminTitle: string
  logo: string
  /** PNG logo used by the public registration form. */
  registrationLogo: string
  /**
   * Logo variant for the admin panel login: same mark, but a separate higher-resolution file with a
   * transparent background, because it is displayed larger there.
   */
  loginLogo: string
  /**
   * HSL without `hsl()`, the format expected by the Tailwind `--primary` variable (see
   * src/app/globals.css and tailwind.config.ts). It is the colour that white text
   * (`--primary-foreground`) is painted over, so it does not always match the landing accent: the
   * landing uses the accent for large type, while buttons and small labels need more contrast.
   */
  primaryColor: string
  landingUrl: string
  /**
   * Absolute public URL of the logo, for the IMAGE header of Meta message templates: the WhatsApp
   * Cloud API downloads the image from outside, so the SPA's relative paths do not work there.
   */
  publicLogo: string
  /**
   * Origins (protocol + host + port, no path) from which the landing may legitimately have called the
   * SPA. `returnUrl()` only trusts `returnTo` if it appears here; otherwise it falls back to
   * `landingUrl`, so a hand-built `?returnTo=` link cannot send the back button to an external domain.
   */
  returnOrigins: string[]
}

const ECOTRAIL: Brand = {
  code: 'ecotrail',
  name: 'Atletics Demo',
  shortName: 'Atletics Demo',
  portalTitle: 'Atletics Demo',
  adminTitle: 'Atletics Demo Admin',
  logo: withBasePath('/athleticsdemo-logo.jpg'),
  registrationLogo: withBasePath('/athleticsdemo-logo.jpg'),
  loginLogo: withBasePath('/athleticsdemo-logo.jpg'),
  // Same value as src/app/globals.css: Atletics Demo does not change look with this refactor.
  primaryColor: '143 28% 17%',
  landingUrl: 'https://black-rock-02336f010.4.azurestaticapps.net',
  publicLogo: 'https://ecotrailbolivia.com/ecotrail-logo-small.png',
  returnOrigins: [
    'https://localhost:5174',
    'https://www.ecotrailbolivia.com',
    'https://ecotrailbolivia.com',
    'https://salmon-coast-0b3a4d310.7.azurestaticapps.net',
    'https://black-rock-02336f010.4.azurestaticapps.net',
  ],
}

const ONESPORT: Brand = {
  code: 'onesport',
  name: 'Atletics Demo',
  shortName: 'Atletics Demo',
  portalTitle: 'Atletics Demo',
  adminTitle: 'Atletics Demo Admin',
  logo: withBasePath('/athleticsdemo-logo.jpg'),
  registrationLogo: withBasePath('/athleticsdemo-logo.jpg'),
  loginLogo: withBasePath('/athleticsdemo-logo.jpg'),
  // Darker orange than the landing's #ff6a2b: white button text did not reach minimum contrast on it.
  primaryColor: '21 90% 40%',
  landingUrl: 'https://www.onesportbolivia.com',
  publicLogo: 'https://www.onesportbolivia.com/onesport-logo-small.png',
  returnOrigins: [
    'https://localhost:5175',
    'https://www.onesportbolivia.com',
    'https://onesportbolivia.com',
    'https://blue-mud-0b98a6c10.7.azurestaticapps.net',
  ],
}

/** Atletics Demo is the default everywhere: it is the original brand, and hosts without their own domain
 * (localhost, *.azurewebsites.net) need to fall back to something. */
export const DEFAULT_BRAND = ECOTRAIL

const BY_CODE: Record<string, Brand> = {
  [ECOTRAIL.code]: ECOTRAIL,
  [ONESPORT.code]: ONESPORT,
}

/** Resolves a brand by its code, e.g. the `brand` returned by the public event API. */
export function brandByCode(code: string | undefined): Brand {
  return (code && BY_CODE[code]) || DEFAULT_BRAND
}

/**
 * Derives the brand from the domain the panel was opened on. Last resort, for when no brand context
 * was saved by `recordBrandContext()` (for example, the panel was opened directly). Works on the
 * brand's own domain and on the shared *.azurestaticapps.net host, because it only compares
 * substrings against each brand's landing hostname.
 */
export function brandFromHost(host: string = window.location.hostname): Brand {
  const found = Object.values(BY_CODE).find((brand) =>
    host.includes(new URL(brand.landingUrl).hostname.replace(/^www\./, '')),
  )

  return found ?? DEFAULT_BRAND
}

const STORAGE_KEY_BRAND = 'aespejo.brand'
const STORAGE_KEY_RETURN = 'aespejo.return'

/**
 * Reads `marca` and `volver` from the query string the landing page sent (see script.js in the
 * landing projects). Those two names are fixed by the landing pages, so they stay in Spanish here.
 * It stores them in `sessionStorage` so they survive the round trip to Auth0 and the
 * SPA's internal navigation, and removes both parameters from the URL.
 *
 * Called once at startup (see the root provider), before the first render that depends on them.
 */
export function recordBrandContext(location: Location = window.location) {
  const params = new URLSearchParams(location.search)
  const brandCode = params.get('marca')
  const returnTo = params.get('volver')

  if (!brandCode && !returnTo) return

  if (brandCode && BY_CODE[brandCode]) {
    sessionStorage.setItem(STORAGE_KEY_BRAND, brandCode)
  }
  if (returnTo) {
    sessionStorage.setItem(STORAGE_KEY_RETURN, returnTo)
  }

  params.delete('marca')
  params.delete('volver')
  const rest = params.toString()
  const url = `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`
  history.replaceState(history.state, '', url)
}

/**
 * Brand of the current screen for login and the athlete portal, which have no event to read it from:
 * first the one stored by `recordBrandContext()`, then the one from the hostname.
 */
export function currentBrand(): Brand {
  // The static build renders on the server first, where there is no session storage or hostname yet.
  if (typeof window === 'undefined') return DEFAULT_BRAND

  const storedCode = sessionStorage.getItem(STORAGE_KEY_BRAND)
  return (storedCode && BY_CODE[storedCode]) || brandFromHost()
}

/**
 * URL for the "back to landing" button: the origin the landing sent through `?volver=`, if it is
 * still one of this brand's valid origins; otherwise the brand's production landing URL.
 */
export function returnUrl(brand: Brand): string {
  const stored = typeof window === 'undefined' ? null : sessionStorage.getItem(STORAGE_KEY_RETURN)
  if (stored && brand.returnOrigins.includes(stored)) return stored
  return brand.landingUrl
}

/**
 * Applies the brand colour by overriding the `--primary` variable the components already use.
 * Done at runtime because the colour is only known once the brand is resolved.
 */
export function applyBrandColor(brand: Brand) {
  document.documentElement.style.setProperty('--primary', brand.primaryColor)
}

/**
 * Updates the tab favicon for the brand. Unlike the title (see `tabTitle`), the favicon does not
 * depend on the route, so it is applied once at startup.
 */
export function applyBrandFavicon(_brand: Brand) {
  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.appendChild(icon)
  }
  icon.type = 'image/svg+xml'
  icon.href = withBasePath('/ae-favicon.svg')
}

/**
 * Tab title for the screens without an event (login and portal), per brand and route: the athlete
 * portal and the admin panel show different names even for the same brand. Recalculated on every
 * navigation, unlike the favicon.
 */
export function tabTitle(brand: Brand, pathname: string): string {
  if (pathname.startsWith('/athlete-portal')) return 'Athlete Portal'
  return pathname.startsWith('/portal') ? brand.portalTitle : brand.adminTitle
}
