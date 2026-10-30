import { api, API_BASE_URL, athleteApi } from './client'
import type {
  AthleteAccount,
  AthleteRow,
  ClaimAthleteProfile,
  SaveAthleteProfile,
  CreateRegistration,
  MoneySportCandidate,
  MoneySportDetail,
  FoundAthlete,
  PublicEvent,
  RegistrationCreated,
  AudienceEstimate,
  AudienceFilter,
  CampaignDetail,
  CampaignRecipient,
  CampaignSummary,
  MessageStatus,
  SaveCampaign,
  SegmentView,
  ConversationDetail,
  ConversationSummary,
  MessageView,
  WhatsAppTemplate,
  MasterReport,
  AthleteDetail,
  AthleteFilter,
  AthleteListing,
  LinkedAccount,
  SaveAthlete,
  BibAssignmentResponse,
  PaymentItem,
  PaymentOutcome,
  ParticipationResult,
  RegisterPayment,
  RegistrationDetail,
  RegistrationFilter,
  RegistrationListing,
  SaveSettings,
  SettingsView,
  AgeCategory,
  AgeCategoryTemplate,
  BatchResultRequest,
  BatchResultResponse,
  Brand,
  CurrentUser,
  EventDetail,
  EventStatus,
  EventSummary,
  Kit,
  KitItem,
  Modality,
  Page,
  PriceTier,
  SaveAgeCategory,
  SaveAgeCategoryTemplate,
  SaveEvent,
  SaveKit,
  SaveKitItem,
  SaveModality,
  SavePriceTier,
  SaveSize,
  Session,
  Size,
} from './types'

export const auth = {
  signIn: (loginName: string, password: string) =>
    api.post<Session>('/auth/login', { loginName, password }),

  me: () => api.get<CurrentUser>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>('/auth/change-password', { currentPassword, newPassword }),
}

export const brands = {
  list: () => api.get<Brand[]>('/brands'),
}

export const events = {
  list: (includeFinished = false, brand?: string) =>
    api.get<EventSummary[]>(
      `/events?includeFinished=${includeFinished}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`,
    ),

  get: (id: number) => api.get<EventDetail>(`/events/${id}`),

  create: (body: SaveEvent) => api.post<EventDetail>('/events', body),

  update: (id: number, body: SaveEvent) => api.put<EventDetail>(`/events/${id}`, body),

  publish: (id: number) => api.post<EventDetail>(`/events/${id}/publish`),

  changeStatus: (id: number, status: EventStatus) =>
    api.post<EventDetail>(`/events/${id}/status`, status),

  delete: (id: number) => api.delete(`/events/${id}`),
}

export const modalities = {
  create: (eventId: number, body: SaveModality) =>
    api.post<Modality>(`/events/${eventId}/modalities`, body),

  update: (id: number, body: SaveModality) => api.put<Modality>(`/modalities/${id}`, body),

  delete: (id: number) => api.delete(`/modalities/${id}`),
}

export const kits = {
  create: (modalityId: number, body: SaveKit) =>
    api.post<Kit>(`/modalities/${modalityId}/kits`, body),

  update: (id: number, body: SaveKit) => api.put<Kit>(`/kits/${id}`, body),

  delete: (id: number) => api.delete(`/kits/${id}`),
}

export const priceTiers = {
  create: (modalityId: number, body: SavePriceTier) =>
    api.post<PriceTier>(`/modalities/${modalityId}/price-tiers`, body),

  update: (id: number, body: SavePriceTier) => api.put<PriceTier>(`/price-tiers/${id}`, body),

  delete: (id: number) => api.delete(`/price-tiers/${id}`),
}

export const ageCategories = {
  list: (eventId: number) => api.get<AgeCategory[]>(`/events/${eventId}/age-categories`),

  create: (eventId: number, body: SaveAgeCategory) =>
    api.post<AgeCategory>(`/events/${eventId}/age-categories`, body),

  generateStandard: (eventId: number) =>
    api.post<AgeCategory[]>(`/events/${eventId}/age-categories/standard`),

  update: (id: number, body: SaveAgeCategory) =>
    api.put<AgeCategory>(`/age-categories/${id}`, body),

  delete: (id: number) => api.delete(`/age-categories/${id}`),
}

/** Global catalog of age ranges, managed from Settings. */
export const ageCategoryTemplates = {
  list: () => api.get<AgeCategoryTemplate[]>('/age-category-templates'),

  create: (body: SaveAgeCategoryTemplate) =>
    api.post<AgeCategoryTemplate>('/age-category-templates', body),

  update: (id: number, body: SaveAgeCategoryTemplate) =>
    api.put<AgeCategoryTemplate>(`/age-category-templates/${id}`, body),

  delete: (id: number) => api.delete(`/age-category-templates/${id}`),
}

/** Public image URLs for `<img>` tags. They are anonymous, so no token is needed. */
export const media = {
  eventImageUrl: (slug: string) => `${API_BASE_URL}/public/events/${slug}/image`,
}

/** Audience builder and saved segments. */
export const audience = {
  estimate: (filter: AudienceFilter) => api.post<AudienceEstimate>('/marketing/audience/estimate', filter),

  /** Rows of the athlete register that match the criterion; the table adds a checkbox per row to exclude it. */
  preview: (filter: AudienceFilter, page = 1, size = 25) =>
    api.post<Page<AthleteRow>>('/marketing/audience/preview', { filter, page, size }),

  segments: () => api.get<SegmentView[]>('/marketing/segments'),

  segment: (id: number) => api.get<SegmentView>(`/marketing/segments/${id}`),

  saveSegment: (body: { name: string; description: string | null; filter: AudienceFilter }) =>
    api.post<SegmentView>('/marketing/segments', body),

  updateSegment: (id: number, body: { name: string; description: string | null; filter: AudienceFilter }) =>
    api.put<SegmentView>(`/marketing/segments/${id}`, body),

  deleteSegment: (id: number) => api.delete(`/marketing/segments/${id}`),
}

/** WhatsApp inbox: what customers write to each brand's number, and the operator's replies. */
export const inbox = {
  list: (filter: { brandId?: number | ''; onlyUnread?: boolean; includeArchived?: boolean; search?: string; page: number; size: number }) =>
    api.get<Page<ConversationSummary>>(`/marketing/inbox/conversations?${toQuery(filter)}`),

  get: (id: number) => api.get<ConversationDetail>(`/marketing/inbox/conversations/${id}`),

  messages: (id: number, page = 1, size = 50) =>
    api.get<Page<MessageView>>(`/marketing/inbox/conversations/${id}/messages?page=${page}&size=${size}`),

  reply: (id: number, text: string) =>
    api.post<MessageView>(`/marketing/inbox/conversations/${id}/reply`, { text }),

  replyWithTemplate: (id: number, body: { templateName: string; language: string; parameters: string[] }) =>
    api.post<MessageView>(`/marketing/inbox/conversations/${id}/reply-template`, body),

  markRead: (id: number) => api.post<void>(`/marketing/inbox/conversations/${id}/read`),

  archive: (id: number, archive: boolean) => api.post<void>(`/marketing/inbox/conversations/${id}/archive?archive=${archive}`),

  /** Media of a message is protected by the session: it is fetched with the token, then shown from an object URL. */
  mediaBlob: (messageId: number) => api.downloadBlob(`/marketing/inbox/messages/${messageId}/media`),

  summary: () => api.get<{ unreadCount: number }>('/marketing/inbox/summary'),
}

/** Templates approved in the brand's WhatsApp Business account. */
export const whatsAppTemplates = {
  list: (brand: string, refresh = false) =>
    api.get<WhatsAppTemplate[]>(`/marketing/whatsapp-templates?brand=${encodeURIComponent(brand)}&refresh=${refresh}`),
}

/** WhatsApp campaigns: a draft is built from an audience, then queued and sent in the background. */
export const campaigns = {
  list: (page = 1, size = 25) => api.get<Page<CampaignSummary>>(`/marketing/campaigns?${toQuery({ page, size })}`),

  get: (id: number) => api.get<CampaignDetail>(`/marketing/campaigns/${id}`),

  recipients: (id: number, status: MessageStatus | '', page = 1, size = 25) =>
    api.get<Page<CampaignRecipient>>(`/marketing/campaigns/${id}/messages?${toQuery({ status, page, size })}`),

  create: (body: SaveCampaign) => api.post<CampaignDetail>('/marketing/campaigns', body),

  /** Recalculates the audience of a draft whose recipients changed. */
  rebuild: (id: number) => api.post<CampaignDetail>(`/marketing/campaigns/${id}/rebuild`),

  send: (id: number) => api.post<CampaignDetail>(`/marketing/campaigns/${id}/send`),

  cancel: (id: number) => api.post<CampaignDetail>(`/marketing/campaigns/${id}/cancel`),

  /** Excludes the athlete from every future campaign. It is the mandatory counterpart of sending marketing. */
  optOut: (athleteId: number) => api.post<void>(`/marketing/athletes/${athleteId}/opt-out`),
}

/** Event reports. */
export const reports = {
  master: (eventId: number) => api.get<MasterReport>(`/events/${eventId}/reports/master`),
}

/** The athlete register: one row per person across all events. */
export const athletes = {
  list: (filter: AthleteFilter) => api.get<AthleteListing>(`/athletes?${toQuery(filter)}`),

  get: (id: number) => api.get<AthleteDetail>(`/athletes/${id}`),

  update: (id: number, body: SaveAthlete) => api.put<AthleteDetail>(`/athletes/${id}`, body),

  accounts: (id: number) => api.get<LinkedAccount[]>(`/athletes/${id}/accounts`),

  unlinkAccount: (accountId: number) => api.delete(`/athletes/accounts/${accountId}`),
}

/** Serializes a filter object to a query string, skipping empty values (the API reads them as "unfiltered" only when absent). */
function toQuery(filter: object): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filter)) {
    if (value === '' || value === undefined || value === null || value === false) continue
    params.set(key, String(value))
  }
  return params.toString()
}

export const payments = {
  list: (registrationId: number) => api.get<PaymentItem[]>(`/registrations/${registrationId}/payments`),

  record: (registrationId: number, body: RegisterPayment) =>
    api.post<PaymentOutcome>(`/registrations/${registrationId}/payments`, body),

  update: (paymentId: number, body: RegisterPayment) =>
    api.put<PaymentOutcome>(`/payments/${paymentId}`, body),

  revert: (paymentId: number, reason: string) =>
    api.post<PaymentOutcome>(`/payments/${paymentId}/revert`, { reason }),
}

export const registrationAccess = {
  /** Authenticated binary (the payment receipt): fetched with the token, then shown as an object URL. */
  receiptBlob: (registrationId: number) => api.downloadBlob(`/registrations/${registrationId}/receipt`),
}

export const registrations = {
  list: (eventId: number, filter: RegistrationFilter) =>
    api.get<RegistrationListing>(`/events/${eventId}/registrations?${toQuery(filter)}`),

  get: (id: number) => api.get<RegistrationDetail>(`/registrations/${id}`),

  setBib: (id: number, bibNumber: number | null) =>
    api.put<BibAssignmentResponse>(`/registrations/${id}/bib`, { bibNumber }),

  /** The screens reload the list after these, so the response body is not read. */
  cancel: (id: number, reason: string) => api.post<void>(`/registrations/${id}/cancel`, { reason }),

  reactivate: (id: number) => api.post<void>(`/registrations/${id}/reactivate`),

  setResult: (id: number, result: ParticipationResult | null) =>
    api.put<void>(`/registrations/${id}/result`, { result }),

  /** Recomputes every registration's age category from the event-day age, after the dates or ranges changed. */
  recalculateAgeCategories: (eventId: number) =>
    api.post<{ registrationsUpdated: number }>(`/events/${eventId}/recalculate-age-categories`),

  /** Records one result for several registrations of the event (the batch endpoint of the Java backend). */
  setResults: (eventId: number, body: BatchResultRequest) =>
    api.put<BatchResultResponse>(`/events/${eventId}/registrations/result`, body),
}

export const sizes = {
  list: () => api.get<Size[]>('/sizes'),

  create: (body: SaveSize) => api.post<Size>('/sizes', body),

  update: (id: number, body: SaveSize) => api.put<Size>(`/sizes/${id}`, body),

  delete: (id: number) => api.delete(`/sizes/${id}`),
}

export const kitItems = {
  list: () => api.get<KitItem[]>('/kit-items'),

  create: (body: SaveKitItem) => api.post<KitItem>('/kit-items', body),

  update: (id: number, body: SaveKitItem) => api.put<KitItem>(`/kit-items/${id}`, body),

  delete: (id: number) => api.delete(`/kit-items/${id}`),
}

/** Photo of a kit: shown in the public form, managed from the event's modalities section. */
export const kitMedia = {
  url: (kitId: number) => `${API_BASE_URL}/kits/${kitId}/image`,

  upload: (kitId: number, file: File) =>
    api.uploadFile<{ path: string }>(`/kits/${kitId}/image`, 'archivo', file),

  delete: (kitId: number) => api.delete(`/kits/${kitId}/image`),
}

/** Payment QR of one price tier and kit combination: the amount is printed in the bank QR, so each one is its own. */
export const priceTierQr = {
  url: (tierId: number, kitId: number) => `${API_BASE_URL}/price-tiers/${tierId}/kits/${kitId}/qr`,

  upload: (tierId: number, kitId: number, file: File) =>
    api.uploadFile<{ path: string }>(`/price-tiers/${tierId}/kits/${kitId}/qr`, 'archivo', file),

  delete: (tierId: number, kitId: number) => api.delete(`/price-tiers/${tierId}/kits/${kitId}/qr`),
}

/** Event files: the cover image and the runner manual. */
export const eventMedia = {
  uploadImage: (eventId: number, file: File) =>
    api.uploadFile<{ path: string }>(`/events/${eventId}/image`, 'archivo', file),

  deleteImage: (eventId: number) => api.delete(`/events/${eventId}/image`),

  uploadRunnerManual: (eventId: number, file: File) =>
    api.uploadFile<{ path: string }>(`/events/${eventId}/runner-manual`, 'archivo', file),

  deleteRunnerManual: (eventId: number) => api.delete(`/events/${eventId}/runner-manual`),

  runnerManualUrl: (slug: string) => `${API_BASE_URL}/public/events/${slug}/runner-manual`,

  /** Same document, forced to download instead of opening inline. */
  runnerManualDownloadUrl: (slug: string) => `${API_BASE_URL}/public/events/${slug}/runner-manual?download=true`,
}

/** Global settings: organization name, default waiver and billing defaults, and the generic payment QR. */
export const settings = {
  get: () => api.get<SettingsView>('/settings'),

  save: (body: SaveSettings) => api.put<SettingsView>('/settings', body),

  suggestedWaiver: () => api.get<{ text: string }>('/settings/suggested-waiver'),
}

export const genericQr = {
  url: () => `${API_BASE_URL}/settings/generic-qr`,

  upload: (file: File) => api.uploadFile<{ path: string }>('/settings/generic-qr', 'archivo', file),

  delete: () => api.delete('/settings/generic-qr'),

  /** The endpoint answers with the image (404 when there is none), so only its status is read. */
  exists: async () => (await fetch(genericQr.url(), { cache: 'no-store' })).ok,
}

/** Public registration: the event page, the document lookup, the sizes and the sign-up. No login required. */
export const publicSite = {
  event: (slug: string) => api.get<PublicEvent>(`/public/events/${slug}`),

  /** Athletes with that document number, so the form can be pre-filled. The slug is optional: the portal searches without an event. */
  findAthletes: (documentNumber: string, slug?: string) =>
    api.get<FoundAthlete[]>(`/public/athletes?${toQuery({ documentNumber, slug })}`),

  sizes: () => api.get<Size[]>('/public/sizes'),

  signUp: (slug: string, body: CreateRegistration) =>
    api.post<RegistrationCreated>(`/public/events/${slug}/registrations`, body),
}

/**
 * Athlete portal: the signed-in person's own account. The Auth0 token is passed explicitly, because the
 * portal runs before any stored session exists.
 */
export const athletePortal = {
  myAccount: (token?: string) => athleteApi.get<AthleteAccount>('/athlete-portal/my-account', token),

  createProfile: (body: SaveAthleteProfile, token?: string) =>
    athleteApi.post<AthleteAccount>('/athlete-portal/my-account', body, token),

  claim: (body: ClaimAthleteProfile, token?: string) =>
    athleteApi.post<AthleteAccount>('/athlete-portal/claim', body, token),

  updateProfile: (body: SaveAthleteProfile, token?: string) =>
    athleteApi.put<AthleteDetail>('/athlete-portal/my-account', body, token),
}

/** Public Money Sport lookup by document number. Rate limited on the server; no login. */
export const moneySport = {
  search: (documentNumber: string) =>
    api.get<MoneySportCandidate[]>(`/public/money-sport?${toQuery({ documentNumber })}`),

  detail: (athleteId: number, documentNumber: string) =>
    api.get<MoneySportDetail>(`/public/money-sport/${athleteId}?${toQuery({ documentNumber })}`),
}

/** Payment QR of a registration, by its code: the image the athlete pays with. */
export const publicQr = {
  url: (code: string) => `${API_BASE_URL}/public/registrations/${code}/qr`,

  /** Same image, forced to download instead of showing inline. */
  downloadUrl: (code: string) => `${API_BASE_URL}/public/registrations/${code}/qr?download=true`,
}

/** Receipt the athlete uploads from the confirmation screen; the cashier reviews it from "Record payment". */
export const publicReceipt = {
  upload: (code: string, file: File) => api.uploadFile<void>(`/public/registrations/${code}/receipt`, 'archivo', file),
}

/** Paged list helper, for screens that show `Page<T>` responses. */
export type PagedResult<T> = Page<T>
