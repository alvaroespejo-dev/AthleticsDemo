import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'
import pt from './locales/pt.json'
import panelEs from './locales/panel-es.json'
import panelEn from './locales/panel-en.json'
import panelPt from './locales/panel-pt.json'
import configurationEs from './locales/configuration-es.json'
import configurationEn from './locales/configuration-en.json'
import configurationPt from './locales/configuration-pt.json'
import operationEs from './locales/operation-es.json'
import operationEn from './locales/operation-en.json'
import operationPt from './locales/operation-pt.json'
import marketingEs from './locales/marketing-es.json'
import marketingEn from './locales/marketing-en.json'
import marketingPt from './locales/marketing-pt.json'
import moneySportEs from './locales/moneysport-es.json'
import moneySportEn from './locales/moneysport-en.json'
import moneySportPt from './locales/moneysport-pt.json'
import portalEs from './locales/portal-es.json'
import portalEn from './locales/portal-en.json'
import portalPt from './locales/portal-pt.json'
import detailEs from './locales/detail-es.json'
import detailEn from './locales/detail-en.json'
import detailPt from './locales/detail-pt.json'
import detailExtraEs from './locales/detail-extra-es.json'
import detailExtraEn from './locales/detail-extra-en.json'
import detailExtraPt from './locales/detail-extra-pt.json'
import formsEs from './locales/forms-es.json'
import formsEn from './locales/forms-en.json'
import formsPt from './locales/forms-pt.json'
import formsExtraEs from './locales/forms-extra-es.json'
import formsExtraEn from './locales/forms-extra-en.json'
import formsExtraPt from './locales/forms-extra-pt.json'
import profileEs from './locales/profile-es.json'
import profileEn from './locales/profile-en.json'
import profilePt from './locales/profile-pt.json'
import profileExtraEs from './locales/profile-extra-es.json'
import profileExtraEn from './locales/profile-extra-en.json'
import profileExtraPt from './locales/profile-extra-pt.json'
import catalogEs from './locales/catalog-es.json'
import catalogEn from './locales/catalog-en.json'
import catalogPt from './locales/catalog-pt.json'
import catalogExtraEs from './locales/catalog-extra-es.json'
import catalogExtraEn from './locales/catalog-extra-en.json'
import catalogExtraPt from './locales/catalog-extra-pt.json'
import catalogMoreEs from './locales/catalog-more-es.json'
import catalogMoreEn from './locales/catalog-more-en.json'
import catalogMorePt from './locales/catalog-more-pt.json'
import eventExtraEs from './locales/event-extra-es.json'
import eventExtraEn from './locales/event-extra-en.json'
import eventExtraPt from './locales/event-extra-pt.json'
import reportsEs from './locales/reports-es.json'
import reportsEn from './locales/reports-en.json'
import reportsPt from './locales/reports-pt.json'
import eventUiEs from './locales/event-ui-es.json'
import eventUiEn from './locales/event-ui-en.json'
import eventUiPt from './locales/event-ui-pt.json'
import eventUiExtraEs from './locales/event-ui-extra-es.json'
import eventUiExtraEn from './locales/event-ui-extra-en.json'
import eventUiExtraPt from './locales/event-ui-extra-pt.json'
import audienceEs from './locales/audience-es.json'
import audienceEn from './locales/audience-en.json'
import audiencePt from './locales/audience-pt.json'
import audienceExtraEs from './locales/audience-extra-es.json'
import audienceExtraEn from './locales/audience-extra-en.json'
import audienceExtraPt from './locales/audience-extra-pt.json'
import paginationEs from './locales/pagination-es.json'
import paginationEn from './locales/pagination-en.json'
import paginationPt from './locales/pagination-pt.json'
import registrantsEs from './locales/registrants-es.json'
import registrantsEn from './locales/registrants-en.json'
import registrantsPt from './locales/registrants-pt.json'
import registrantsExtraEs from './locales/registrants-extra-es.json'
import registrantsExtraEn from './locales/registrants-extra-en.json'
import registrantsExtraPt from './locales/registrants-extra-pt.json'
import athletesEs from './locales/athletes-es.json'
import athletesEn from './locales/athletes-en.json'
import athletesPt from './locales/athletes-pt.json'
import athletesExtraEs from './locales/athletes-extra-es.json'
import athletesExtraEn from './locales/athletes-extra-en.json'
import athletesExtraPt from './locales/athletes-extra-pt.json'
import settingsExtraEs from './locales/settings-extra-es.json'
import settingsExtraEn from './locales/settings-extra-en.json'
import settingsExtraPt from './locales/settings-extra-pt.json'
import resultadoEs from './locales/result-es.json'
import resultadoEn from './locales/result-en.json'
import resultadoPt from './locales/result-pt.json'
import resultExtraEs from './locales/result-extra-es.json'
import resultExtraEn from './locales/result-extra-en.json'
import resultExtraPt from './locales/result-extra-pt.json'
import validationEs from './locales/validation-es.json'
import validationEn from './locales/validation-en.json'
import validationPt from './locales/validation-pt.json'
import commonEs from './locales/common-es.json'
import commonEn from './locales/common-en.json'
import commonPt from './locales/common-pt.json'
import eventFormEs from './locales/event-form-es.json'
import eventFormEn from './locales/event-form-en.json'
import eventFormPt from './locales/event-form-pt.json'
import modalitiesEs from './locales/modalities-es.json'
import modalitiesEn from './locales/modalities-en.json'
import modalitiesPt from './locales/modalities-pt.json'
import eventSectionsEs from './locales/event-sections-es.json'
import eventSectionsEn from './locales/event-sections-en.json'
import eventSectionsPt from './locales/event-sections-pt.json'
import settingsPageEs from './locales/settings-page-es.json'
import settingsPageEn from './locales/settings-page-en.json'
import settingsPagePt from './locales/settings-page-pt.json'
import registrationsEs from './locales/registrations-es.json'
import registrationsEn from './locales/registrations-en.json'
import registrationsPt from './locales/registrations-pt.json'
import athletesPageEs from './locales/athletes-page-es.json'
import athletesPageEn from './locales/athletes-page-en.json'
import athletesPagePt from './locales/athletes-page-pt.json'
import inboxPageEs from './locales/inbox-page-es.json'
import inboxPageEn from './locales/inbox-page-en.json'
import inboxPagePt from './locales/inbox-page-pt.json'
import audiencePageEs from './locales/audience-page-es.json'
import audiencePageEn from './locales/audience-page-en.json'
import audiencePagePt from './locales/audience-page-pt.json'
import campaignsPageEs from './locales/campaigns-page-es.json'
import campaignsPageEn from './locales/campaigns-page-en.json'
import campaignsPagePt from './locales/campaigns-page-pt.json'
import publicPageEs from './locales/public-page-es.json'
import publicPageEn from './locales/public-page-en.json'
import publicPagePt from './locales/public-page-pt.json'
import athletePortalEs from './locales/athlete-portal-es.json'
import athletePortalEn from './locales/athlete-portal-en.json'
import athletePortalPt from './locales/athlete-portal-pt.json'

const RESOURCES = {
  es: { translation: { ...es, ...panelEs, ...configurationEs, configuration: { ...configurationEs.configuration, ...settingsExtraEs.configuration }, ...operationEs, ...marketingEs, ...portalEs, ...moneySportEs, detail: { ...detailEs.detail, ...detailExtraEs.detail }, status: detailExtraEs.status, reports: { ...es.reports, ...reportsEs.reports }, ...audienceEs, ...paginationEs, registrants: { ...registrantsEs.registrants, ...registrantsExtraEs.registrants }, athletes: { ...es.athletes, ...athletesEs.athletes, ...athletesExtraEs.athletes }, eventUi: { ...eventUiEs.eventUi, ...eventUiExtraEs.eventUi }, audience: { ...audienceEs.audience, ...audienceExtraEs.audience }, catalog: { ...catalogEs.catalog, ...catalogExtraEs.catalog, ...catalogMoreEs.catalog }, events: { ...es.events, ...eventExtraEs.events }, profile: { ...profileEs.profile, ...profileExtraEs.profile }, forms: { ...formsEs.forms, ...formsExtraEs.forms }, resultado: resultadoEs.resultado, result: resultExtraEs.result, validation: validationEs.validation, common: commonEs.common, eventForm: eventFormEs.eventForm, modalities: modalitiesEs.modalities, eventSections: eventSectionsEs.eventSections, settingsPage: settingsPageEs.settingsPage, registrations: registrationsEs.registrations, athletesPage: athletesPageEs.athletesPage, inboxPage: inboxPageEs.inboxPage, audiencePage: audiencePageEs.audiencePage, campaignsPage: campaignsPageEs.campaignsPage, publicPage: publicPageEs.publicPage, athletePortal: athletePortalEs.athletePortal } },
  en: { translation: { ...en, ...panelEn, ...configurationEn, configuration: { ...configurationEn.configuration, ...settingsExtraEn.configuration }, ...operationEn, ...marketingEn, ...portalEn, ...moneySportEn, detail: { ...detailEn.detail, ...detailExtraEn.detail }, status: detailExtraEn.status, reports: { ...en.reports, ...reportsEn.reports }, ...audienceEn, ...paginationEn, registrants: { ...registrantsEn.registrants, ...registrantsExtraEn.registrants }, athletes: { ...en.athletes, ...athletesEn.athletes, ...athletesExtraEn.athletes }, eventUi: { ...eventUiEn.eventUi, ...eventUiExtraEn.eventUi }, audience: { ...audienceEn.audience, ...audienceExtraEn.audience }, catalog: { ...catalogEn.catalog, ...catalogExtraEn.catalog, ...catalogMoreEn.catalog }, events: { ...en.events, ...eventExtraEn.events }, profile: { ...profileEn.profile, ...profileExtraEn.profile }, forms: { ...formsEn.forms, ...formsExtraEn.forms }, resultado: resultadoEn.resultado, result: resultExtraEn.result, validation: validationEn.validation, common: commonEn.common, eventForm: eventFormEn.eventForm, modalities: modalitiesEn.modalities, eventSections: eventSectionsEn.eventSections, settingsPage: settingsPageEn.settingsPage, registrations: registrationsEn.registrations, athletesPage: athletesPageEn.athletesPage, inboxPage: inboxPageEn.inboxPage, audiencePage: audiencePageEn.audiencePage, campaignsPage: campaignsPageEn.campaignsPage, publicPage: publicPageEn.publicPage, athletePortal: athletePortalEn.athletePortal } },
  pt: { translation: { ...pt, ...panelPt, ...configurationPt, configuration: { ...configurationPt.configuration, ...settingsExtraPt.configuration }, ...operationPt, ...marketingPt, ...portalPt, ...moneySportPt, detail: { ...detailPt.detail, ...detailExtraPt.detail }, status: detailExtraPt.status, reports: { ...pt.reports, ...reportsPt.reports }, ...audiencePt, ...paginationPt, registrants: { ...registrantsPt.registrants, ...registrantsExtraPt.registrants }, athletes: { ...pt.athletes, ...athletesPt.athletes, ...athletesExtraPt.athletes }, eventUi: { ...eventUiPt.eventUi, ...eventUiExtraPt.eventUi }, audience: { ...audiencePt.audience, ...audienceExtraPt.audience }, catalog: { ...catalogPt.catalog, ...catalogExtraPt.catalog, ...catalogMorePt.catalog }, events: { ...pt.events, ...eventExtraPt.events }, profile: { ...profilePt.profile, ...profileExtraPt.profile }, forms: { ...formsPt.forms, ...formsExtraPt.forms }, resultado: resultadoPt.resultado, result: resultExtraPt.result, validation: validationPt.validation, common: commonPt.common, eventForm: eventFormPt.eventForm, modalities: modalitiesPt.modalities, eventSections: eventSectionsPt.eventSections, settingsPage: settingsPagePt.settingsPage, registrations: registrationsPt.registrations, athletesPage: athletesPagePt.athletesPage, inboxPage: inboxPagePt.inboxPage, audiencePage: audiencePagePt.audiencePage, campaignsPage: campaignsPagePt.campaignsPage, publicPage: publicPagePt.publicPage, athletePortal: athletePortalPt.athletePortal } }};

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'aespejo.lang'

/**
 * Starts with English on both server and client so the first render matches during hydration. The
 * saved language is applied afterwards, from an effect in the root provider (see `applySavedLanguage`).
 */
i18n.use(initReactI18next).init({
  resources: RESOURCES,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

/** Applies the language saved in the browser. Client-only: it reads `localStorage`. */
export function applySavedLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved) && saved !== i18n.language) {
    void i18n.changeLanguage(saved)
  }
}

i18n.on('languageChanged', (language) => {
  // The API reads the document language to localise its messages (see `acceptLanguage` in api/client.ts).
  document.documentElement.lang = language
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Storage blocked (private window): the language still changes for this session.
  }
})

export default i18n


