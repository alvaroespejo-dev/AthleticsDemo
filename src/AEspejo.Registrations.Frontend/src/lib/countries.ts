import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js'

/**
 * Country catalogue for the phone selector and the nationality combo. The country code is ISO 3166-1
 * alpha-2 (what libphonenumber-js expects and what is stored as the athlete's nationality); the calling
 * code is not typed by hand, it comes from the library so the two cannot drift apart.
 *
 * Bolivia comes first because it is the default; then the neighbours, where most foreign runners come
 * from; the rest in the order they are listed. Names are never stored here: they come from
 * Intl.DisplayNames in the active language, so the catalogue has no text to translate.
 */
const COUNTRY_CODES: CountryCode[] = [
  'BO', 'AR', 'BR', 'CL', 'PE', 'PY', 'CO', 'EC', 'UY', 'VE', 'MX', 'US', 'CA', 'ES', 'FR', 'DE', 'IT', 'GB',
  'PT', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU', 'CN', 'JP', 'KR', 'IN', 'RU', 'IL', 'ZA', 'CH', 'NL',
  'BE', 'SE', 'NO', 'IE', 'AT', 'NZ', 'AU',
]

export interface Country {
  code: CountryCode
  /** Calling code without the "+", e.g. "591". */
  callingCode: string
}

export const COUNTRIES: Country[] = COUNTRY_CODES.map((code) => ({
  code,
  callingCode: getCountryCallingCode(code),
}))

export const DEFAULT_COUNTRY: CountryCode = 'BO'

/** Calling code of the default country, without the "+". */
export const DEFAULT_CALLING_CODE = getCountryCallingCode(DEFAULT_COUNTRY)

/**
 * Code for "the country is not in the list". It is not a real country: "ZZ" is part of the range ISO
 * 3166-1 reserves for private use (with AA, QM–QZ and XA–XZ), so it never clashes with a real code.
 * It fills the two positions the database expects for the nationality.
 */
export const OTHER_NATIONALITY = 'ZZ'

export function countryByCode(code: string | null | undefined): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

/** Name of a country in the given language. Falls back to the code when the browser has no name for it. */
export function countryDisplayName(code: string, language: string): string {
  return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code
}
