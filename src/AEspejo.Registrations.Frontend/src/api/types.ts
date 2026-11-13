// Mirror of the backend's JSON contract (AEspejo.Registrations.Backend).
// Enums travel as their Java constant names, so they are string unions here: if the API renames a
// value, TypeScript flags it at compile time. Dates are ISO strings (LocalDate: yyyy-mm-dd;
// OffsetDateTime: full ISO with offset).

export type EventStatus = 'Draft' | 'Published' | 'Closed' | 'Finished' | 'Cancelled'

export type Sex = 'Female' | 'Male'

export type GarmentType = 'TShirt' | 'Singlet'

export type UserRole = 'Admin' | 'Cashier' | 'KitStaff' | 'ReadOnly'

export type RegistrationStatus =
  | 'Draft'
  | 'Pending'
  | 'Paid'
  | 'UnderReview'
  | 'Expired'
  | 'Cancelled'
  | 'Refunded'

export type ParticipationResult = 'Finished' | 'Dropped' | 'NoShow'

export type DocumentType = 'Ci' | 'Dni' | 'Passport' | 'ForeignerId' | 'Rut' | 'Cpf' | 'Other'

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Cancelled'

export type MessageDirection = 'Inbound' | 'Outbound'

export type MessageStatus = 'Pending' | 'Sent' | 'Delivered' | 'Read' | 'Failed'

export type WhatsAppContentType =
  | 'Text'
  | 'Image'
  | 'Audio'
  | 'Video'
  | 'Document'
  | 'Sticker'
  | 'Location'
  | 'Contact'
  | 'Reaction'
  | 'Button'
  | 'Template'
  | 'Unsupported'

// ---- Auth ----

/** Response of POST /api/auth/login. */
export interface Session {
  token: string
  expiresAt: string
  userId: number
  loginName: string
  name: string
  role: UserRole
  preferredLanguage: string
}

/** Response of GET /api/auth/me. */
export interface CurrentUser {
  userId: number
  loginName: string
  name: string
  role: UserRole
  preferredLanguage: string
}

// ---- Pagination ----

/** One page of a list (common/PageResponse.java). Page numbers start at 1. */
export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

// ---- Catalog: brands, events, modalities, kits, price tiers, categories ----

export interface Brand {
  id: number
  code: string
  name: string
  active: boolean
}

/** Row of the event list. */
export interface EventSummary {
  id: number
  name: string
  brandId: number
  brandName: string
  slug: string
  location: string | null
  eventDate: string
  registrationOpensAt: string
  registrationClosesAt: string
  status: EventStatus
  modalityCount: number
  paidRegistrations: number
  pendingRegistrations: number
  serviceFeeCents: number
  imagePath: string | null
}

export interface EventDetail {
  id: number
  name: string
  brandId: number
  brandName: string
  slug: string
  description: string | null
  location: string | null
  eventDate: string
  registrationOpensAt: string
  registrationClosesAt: string
  sizeChangeClosesAt: string | null
  status: EventStatus
  reservationHours: number
  paymentToleranceCents: number
  serviceFeeCents: number
  waiverText: string | null
  imagePath: string | null
  runnerManualPath: string | null
  runnerManualName: string | null
  modalities: Modality[]
  ageCategories: AgeCategory[]
}

export interface Modality {
  id: number
  eventId: number
  name: string
  /** Integer metres, so distances cannot be typed as "10.5K". */
  distanceMeters: number
  quota: number | null
  sortOrder: number
  minAge: number | null
  active: boolean
  bibFrom: number | null
  bibTo: number | null
  occupiedSeats: number
  kits: Kit[]
  priceTiers: PriceTier[]
  /** Which price tier and kit combinations already have a payment QR uploaded (existence only). */
  paymentQrCodes: PaymentQrCodeReference[]
}

export interface PaymentQrCodeReference {
  priceTierId: number
  kitId: number
}

export interface Kit {
  id: number
  modalityId: number
  name: string
  description: string | null
  /** Set when one of the items requires a size. Derived from the items, not stored separately. */
  requiredSizeType: GarmentType | null
  surchargeCents: number
  sortOrder: number
  active: boolean
  /** Whether the kit already has a photo. The image itself is fetched through `kitImage.url(id)`. */
  hasImage: boolean
  items: KitItem[]
}

export interface KitItem {
  id: number
  name: string
  sortOrder: number
  active: boolean
  requiredSizeType: GarmentType | null
}

export interface PriceTier {
  id: number
  modalityId: number
  name: string
  priceCents: number
  validFrom: string
  validTo: string
}

export interface AgeCategory {
  id: number
  eventId: number
  name: string
  sex: Sex
  minAge: number
  maxAge: number
  modalityId: number | null
  sortOrder: number
}

export interface AgeCategoryTemplate {
  id: number
  name: string
  minAge: number
  maxAge: number
  sortOrder: number
}

export interface Size {
  id: number
  measure: string
  type: GarmentType
  sortOrder: number
  active: boolean
}

// ---- Write bodies (the Save* records of CatalogModels.java) ----

export interface SaveEvent {
  name: string
  brandId: number
  slug?: string | null
  description?: string | null
  location?: string | null
  eventDate: string
  registrationOpensAt: string
  registrationClosesAt: string
  sizeChangeClosesAt?: string | null
  reservationHours: number
  paymentToleranceCents: number
  serviceFeeCents?: number | null
  waiverText?: string | null
  imagePath?: string | null
  runnerManualPath?: string | null
  runnerManualName?: string | null
}

export interface SaveModality {
  name: string
  distanceMeters: number
  quota?: number | null
  sortOrder: number
  minAge?: number | null
  active: boolean
  bibFrom?: number | null
  bibTo?: number | null
}

export interface SaveKit {
  name: string
  description?: string | null
  surchargeCents: number
  sortOrder: number
  active: boolean
  itemIds?: number[]
}

export interface SaveKitItem {
  name: string
  sortOrder: number
  active: boolean
  requiredSizeType?: GarmentType | null
}

export interface SaveSize {
  measure: string
  type: GarmentType
  sortOrder: number
  active: boolean
}

export interface SavePriceTier {
  name: string
  priceCents: number
  validFrom: string
  validTo: string
}

export interface SaveAgeCategory {
  name: string
  sex: Sex
  minAge: number
  maxAge: number
  modalityId?: number | null
  sortOrder: number
}

export interface SaveAgeCategoryTemplate {
  name: string
  minAge: number
  maxAge: number
  sortOrder: number
}

// ---- Registrations (RegistrationModels.java, PaymentModels.java) ----

export type PaymentSource = 'Statement' | 'Receipt' | 'Manual' | 'Webhook'

export type ReconciliationRule = 'None' | 'TransactionNumber' | 'AmountAndPayer' | 'Manual'

/** Result of assigning or clearing a bib (RegistrationModels.BibAssignmentResponse). */
export interface BibAssignmentResponse {
  registrationId: number | null
  bibNumber: number | null
  warning: string | null
  message: string
}

export type RegistrationOrder = 'DateDesc' | 'DateAsc' | 'LastName' | 'Bib' | 'Modality'

export interface RegistrationRow {
  id: number
  code: string
  status: RegistrationStatus
  bibNumber: number | null
  documentType: DocumentType
  documentNumber: string
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  age: number
  phone: string
  email: string | null
  city: string | null
  modality: string
  distanceMeters: number
  kit: string
  requiresSize: boolean
  size: string | null
  ageCategory: string | null
  amountCents: number
  totalPaidCents: number
  createdAt: string
  reservationExpiresAt: string | null
  kitDelivered: boolean
  bibFrom: number | null
  bibTo: number | null
  hasReceipt: boolean
  result: ParticipationResult | null
  resultAt: string | null
  moneySportDiscountCents: number
}

export interface RegistrationPage {
  items: RegistrationRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** Counts and money of the whole event, not only of the page shown. */
export interface RegistrationSummary {
  total: number
  paid: number
  pending: number
  underReview: number
  expired: number
  cancelled: number
  collectedCents: number
  expectedCents: number
  withoutSize: number
  withoutBib: number
  kitsDelivered: number
  withoutEmergencyContact: number
  withoutResult: number
}

export interface RegistrationListing {
  page: RegistrationPage
  summary: RegistrationSummary
}

export interface RegistrationFilter {
  text?: string
  status?: RegistrationStatus | ''
  modalityId?: number | ''
  ageCategoryId?: number | ''
  sex?: Sex | ''
  withoutSize?: boolean
  withoutBib?: boolean
  kitDelivered?: boolean
  withoutEmergencyContact?: boolean
  withoutResult?: boolean
  order?: RegistrationOrder
  page?: number
  size?: number
}

export interface AthleteInfo {
  id: number
  documentType: DocumentType
  documentNumber: string
  documentNumberOriginal: string | null
  nationality: string | null
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  age: number
  phone: string
  email: string | null
  city: string | null
  club: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  bloodType: string | null
  allergies: string | null
  marketingOptIn: boolean
  marketingOptInAt: string | null
  unsubscribedAt: string | null
  eventsParticipated: number
}

export interface KitDeliveryInfo {
  deliveredAt: string
  user: string
  deliveryPoint: string | null
  pickedUpBy: string | null
}

export interface PaymentItem {
  id: number
  transactionNumber: string
  amountCents: number
  creditedAt: string
  sourceBank: string | null
  payerName: string | null
  source: PaymentSource
  surplusCents: number
  recordedAt: string
  rule: ReconciliationRule
}

export interface RegistrationDetail {
  id: number
  code: string
  status: RegistrationStatus
  bibNumber: number | null
  eventName: string
  eventDate: string
  modality: string
  kit: string
  size: string | null
  ageCategory: string | null
  amountCents: number
  moneySportDiscountCents: number
  totalPaidCents: number
  createdAt: string
  reservationExpiresAt: string | null
  paidAt: string | null
  waiverAccepted: boolean
  waiverAcceptedAt: string | null
  waiverIp: string | null
  acquisitionChannel: string | null
  referralCode: string | null
  complimentary: boolean
  notes: string | null
  result: ParticipationResult | null
  resultAt: string | null
  athlete: AthleteInfo
  payments: PaymentItem[]
  kitDelivery: KitDeliveryInfo | null
  hasReceipt: boolean
}

export interface RegisterPayment {
  transactionNumber: string
  amountCents: number
  creditedAt: string
  sourceBank?: string | null
  payerName?: string | null
  notes?: string | null
}

export interface PaymentOutcome {
  paymentId: number | null
  status: RegistrationStatus
  totalPaidCents: number
  expectedCents: number
  missingCents: number
  surplusCents: number
  message: string
}

// ---- Audience and segments (marketing/AudienceModels.java, SegmentService.java) ----

export type AudienceScope = 'All' | 'Event' | 'Segment' | 'Participants'

export type AudienceField =
  | 'City'
  | 'Club'
  | 'Nationality'
  | 'Sex'
  | 'Age'
  | 'Participated'
  | 'LastRaceYear'
  | 'EventsParticipated'
  | 'HasEmail'

export type AudienceOperator = 'Equal' | 'NotEqual' | 'Greater' | 'GreaterOrEqual' | 'Less' | 'LessOrEqual' | 'Contains'

/** One row of the filter builder. The value travels as text and is converted to the field's type by the API. */
export interface AudienceCondition {
  field: AudienceField
  operator: AudienceOperator
  value: string
}

/** The whole segmentation criterion. Conditions are combined with AND. */
export interface AudienceFilter {
  scope: AudienceScope
  eventId: number | null
  segmentId: number | null
  conditions: AudienceCondition[]
  excludedAthleteIds: number[]
}

export interface AudienceEstimate {
  total: number
  withWhatsApp: number
  withEmail: number
}

export interface SegmentView {
  id: number
  name: string
  description: string | null
  filter: AudienceFilter
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

// ---- WhatsApp campaigns (marketing/CampaignModels.java) ----

/** Counters of a campaign's progress bar. They always add up to the total number of recipients. */
export interface CampaignProgress {
  total: number
  pending: number
  sent: number
  delivered: number
  read: number
  failed: number
}

export interface CampaignSummary {
  id: number
  name: string
  status: CampaignStatus
  brandName: string
  eventName: string | null
  templateName: string | null
  provider: string | null
  createdAt: string
  sentAt: string | null
  createdBy: string
  progress: CampaignProgress
}

export interface CampaignDetail {
  id: number
  name: string
  status: CampaignStatus
  brandId: number
  brandName: string
  body: string
  templateName: string | null
  templateLanguage: string | null
  header: string | null
  eventId: number | null
  eventName: string | null
  filter: AudienceFilter
  provider: string | null
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  createdBy: string
  progress: CampaignProgress
}

/** One recipient of a campaign, with its delivery status and last error. */
export interface CampaignRecipient {
  id: number
  athleteId: number
  athleteName: string
  phone: string
  status: MessageStatus
  renderedBody: string
  externalId: string | null
  attempts: number
  lastError: string | null
  sentAt: string | null
}

/** Body of create. The campaign is created as a draft and nothing is sent. */
export interface SaveCampaign {
  name: string
  body: string
  templateName: string | null
  templateLanguage: string | null
  header: string | null
  headerMediaUrl: string | null
  brandId: number
  eventId: number | null
  filter: AudienceFilter
}

// ---- WhatsApp inbox (marketing/InboxModels.java) ----

/** Meta's 24-hour customer-service window: only inside it can free text be sent. */
export interface InboxWindow {
  open: boolean
  closesAt: string | null
  minutesRemaining: number
}

export interface ConversationSummary {
  id: number
  brandId: number
  brandCode: string
  brandName: string
  phoneE164: string
  profileName: string | null
  athleteId: number | null
  athleteName: string | null
  lastMessageAt: string | null
  lastMessageSummary: string | null
  unreadCount: number
  archived: boolean
  window: InboxWindow
}

export interface ConversationDetail {
  id: number
  brandId: number
  brandCode: string
  brandName: string
  phoneE164: string
  waId: string | null
  profileName: string | null
  athleteId: number | null
  athleteName: string | null
  lastMessageAt: string | null
  unreadCount: number
  archived: boolean
  window: InboxWindow
}

export interface MessageView {
  id: number
  direction: MessageDirection
  contentType: WhatsAppContentType
  text: string | null
  status: MessageStatus
  error: string | null
  messageAt: string
  externalId: string | null
  externalRepliedId: string | null
  hasMedia: boolean
  mediaMimeType: string | null
  mediaFileName: string | null
  mediaSizeBytes: number | null
  mediaAvailable: boolean
  sentBy: string | null
  templateName: string | null
}

/** A WhatsApp template approved in the brand's account (WhatsAppTemplateCatalog.Template). */
export interface WhatsAppTemplate {
  name: string
  language: string
  status: string
  category: string
  header: string | null
  headerFormat: string | null
  body: string
  footer: string | null
  parameterCount: number
  bodyExamples: string[]
}

// ---- Athlete portal (portal/PortalModels.java) ----

/** The signed-in account. `profile` stays null until the person completes the sign-up. */
export interface AthleteAccount {
  accountId: number | null
  athleteId: number | null
  email: string | null
  profile: AthleteDetail | null
  suggestedFirstNames: string | null
  suggestedLastNames: string | null
}

/** Sign-up and profile body of the portal. */
export interface SaveAthleteProfile {
  documentType: DocumentType
  documentNumber: string
  nationality: string | null
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  phoneCountryCode: string
  phoneNumber: string
  city: string | null
  club: string | null
  emergencyContactName: string | null
  emergencyContactPhoneCountryCode: string | null
  emergencyContactPhoneNumber: string | null
  bloodType: string | null
  allergies: string | null
  acceptsMarketing: boolean
}

/** Claim of an athlete who already exists, verified with document plus phone. */
export interface ClaimAthleteProfile {
  documentType: DocumentType
  documentNumber: string
  nationality: string | null
  phoneCountryCode: string
  phoneNumber: string
}

// ---- Money Sport (moneysport/MoneySportController.java, application/moneysport/MoneySportService.java) ----

/** One person matching the document number. Several can share a number across document types or nationalities. */
export interface MoneySportCandidate {
  id: number
  documentType: DocumentType
  documentNumber: string
  firstNames: string
  lastNames: string
  nationality: string | null
}

export type MoneySportMovementType = 'Credit' | 'Debit'

export interface MoneySportMovement {
  type: MoneySportMovementType
  amountCents: number
  date: string
  eventName: string
}

/** Read-only balance of one athlete: no contact or medical data, since the lookup is open to anyone with a document number. */
export interface MoneySportDetail {
  documentType: DocumentType
  firstNames: string
  lastNames: string
  documentNumber: string
  balanceCents: number
  creditedCents: number
  usedCents: number
  participations: AthleteParticipation[]
  movements: MoneySportMovement[]
}

// ---- Public registration (catalog/PublicEventService.java, registration/RegistrationModels.java) ----

/** One distance of the public event page. `priceCents` stays null while no price tier applies. */
export interface PublicModality {
  id: number
  name: string
  distanceMeters: number
  minAge: number | null
  available: boolean
  seatsLeft: number | null
  priceCents: number | null
  priceTierName: string | null
  serviceFeeCents: number
  kits: PublicKit[]
}

export interface PublicKit {
  id: number
  name: string
  description: string | null
  requiredSizeType: GarmentType | null
  surchargeCents: number
  hasImage: boolean
  items: string[]
  totalPriceCents: number | null
}

export interface PublicEvent {
  id: number
  name: string
  brandCode: string
  slug: string
  description: string | null
  location: string | null
  eventDate: string
  registrationOpensAt: string
  registrationClosesAt: string
  registrationOpen: boolean
  closedReason: string | null
  waiverText: string | null
  reservationHours: number
  hasImage: boolean
  hasRunnerManual: boolean
  runnerManualName: string | null
  modalities: PublicModality[]
}

/** A person already in the register, offered to pre-fill the form when the document matches. */
export interface FoundAthlete {
  id: number
  documentType: DocumentType
  documentNumber: string
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  phoneCountryCode: string
  phoneNumber: string
  email: string | null
  city: string | null
  club: string | null
  nationality: string | null
  emergencyContactName: string | null
  emergencyContactPhoneCountryCode: string | null
  emergencyContactPhoneNumber: string | null
  bloodType: string | null
  allergies: string | null
  alreadyRegisteredInEvent: boolean | null
  moneySportBalanceCents: number
}

/** Body of the public sign-up. */
export interface CreateRegistration {
  modalityId: number
  kitId: number
  sizeId: number | null
  documentType: DocumentType
  documentNumber: string
  nationality: string | null
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  phoneCountryCode: string
  phoneNumber: string
  email: string | null
  city: string | null
  club: string | null
  emergencyContactName: string | null
  emergencyContactPhoneCountryCode: string | null
  emergencyContactPhoneNumber: string | null
  bloodType: string | null
  allergies: string | null
  waiverAccepted: boolean
  marketingOptIn: boolean
  acquisitionChannel: string | null
  referralCode: string | null
  athleteId: number | null
  useMoneySportBalanceCents: number | null
}

export interface RegistrationCreated {
  id: number
  code: string
  status: RegistrationStatus
  eventName: string
  athleteName: string
  modalityName: string
  kitName: string
  sizeLabel: string | null
  ageCategoryName: string | null
  amountCents: number
  reservationExpiresAt: string | null
  hasQr: boolean
  moneySportDiscountCents: number
}

// ---- Master report (report/MasterReportModels.java) ----

export interface MasterReport {
  totalRegistrations: number
  byModality: { modality: string; kit: string; count: number; collectedCents: number }[]
  byDistance: { distance: string; count: number }[]
  byCategory: { category: string; count: number }[]
  shirts: { sex: string; size: string; count: number }[]
}

// ---- Athlete register (athlete/AthleteModels.java) ----

export type AthleteOrder = 'LastNameAsc' | 'RecentDesc' | 'MostEvents' | 'LastRaceDesc'

export interface AthleteFilter {
  text?: string
  city?: string
  club?: string
  sex?: Sex | ''
  minAge?: number | ''
  maxAge?: number | ''
  marketingOptIn?: boolean
  withEmail?: boolean
  eventId?: number | ''
  order?: AthleteOrder
  page?: number
  size?: number
}

export interface AthleteRow {
  id: number
  documentType: DocumentType
  documentNumber: string
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  age: number
  phone: string
  email: string | null
  city: string | null
  club: string | null
  eventsRegistered: number
  eventsPaid: number
  lastEventName: string | null
  lastEventDate: string | null
  marketingOptIn: boolean
  unsubscribedAt: string | null
}

export interface AthleteSummary {
  total: number
  withWhatsApp: number
  withEmail: number
  withMarketingOptIn: number
  unsubscribed: number
}

export interface AthleteListing {
  page: Page<AthleteRow>
  summary: AthleteSummary
}

export interface AthleteParticipation {
  registrationId: number
  eventId: number
  code: string
  eventName: string
  eventDate: string
  modality: string
  status: RegistrationStatus
  bibNumber: number | null
  distanceMeters: number
  result: ParticipationResult | null
}

export interface AthleteDetail {
  id: number
  documentType: DocumentType
  documentNumber: string
  documentNumberOriginal: string | null
  nationality: string | null
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  age: number
  phoneCountryCode: string
  phoneNumber: string
  email: string | null
  city: string | null
  club: string | null
  emergencyContactName: string | null
  emergencyContactPhoneCountryCode: string | null
  emergencyContactPhoneNumber: string | null
  bloodType: string | null
  allergies: string | null
  marketingOptIn: boolean
  marketingOptInAt: string | null
  unsubscribedAt: string | null
  createdAt: string
  updatedAt: string
  participations: AthleteParticipation[]
}

export interface SaveAthlete {
  documentType: DocumentType
  documentNumber: string
  nationality?: string | null
  firstNames: string
  lastNames: string
  sex: Sex
  birthDate: string
  phoneCountryCode: string
  phoneNumber: string
  email?: string | null
  city?: string | null
  club?: string | null
  emergencyContactName?: string | null
  emergencyContactPhoneCountryCode?: string | null
  emergencyContactPhoneNumber?: string | null
  bloodType?: string | null
  allergies?: string | null
}

export interface LinkedAccount {
  accountId: number
  provider: string
  email: string | null
  createdAt: string
  lastAccessAt: string | null
}

// ---- Registration results (RegistrationModels.java) ----

export interface BatchResultRequest {
  registrationIds: number[]
  result: ParticipationResult | null
}

export interface BatchResultResponse {
  updated: number
  omitted: number
  message: string
}

// ---- Settings (settings/SettingsModels.java) ----

export interface SettingsView {
  organizationName: string | null
  defaultWaiverText: string | null
  defaultReservationHours: number
  defaultPaymentToleranceCents: number
  serviceFeeCents: number
  moneySportAmountCents: number
  currencyCode: string
  updatedAt: string
}

export interface SaveSettings {
  organizationName?: string | null
  defaultWaiverText?: string | null
  defaultReservationHours: number
  defaultPaymentToleranceCents: number
  serviceFeeCents: number
  moneySportAmountCents: number
  currencyCode: string
}

// ---- Problem responses (common/exception/ApiExceptionHandler.java) ----

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  fields?: Record<string, string>
}
