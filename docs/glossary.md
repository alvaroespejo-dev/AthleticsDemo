# Glossary

English names for the domain. Every class, enum, table, column and API field uses these names.

## Classes

Athlete, AthleteAccount, AthleteImportBatch, AthleteImportRow, AgeCategory, AgeCategoryTemplate, Brand, Campaign,
CampaignMessage, Event, Kit, KitDelivery, KitItem, Language, Modality, ModalityEquivalence, MoneySportMovement,
Payment, PaymentQrCode, PriceTier, Registration, Segment, Size, StatementImportBatch, StatementMovement,
SystemSettings, User, WhatsAppConversation, WhatsAppMessage, AuditRecord.

## Enums

| Enum | Values |
|---|---|
| RegistrationStatus | Draft, Pending, Paid, UnderReview, Expired, Cancelled, Refunded |
| EventStatus | Draft, Published, Closed, Finished, Cancelled |
| CampaignStatus | Draft, Scheduled, Sending, Sent, Cancelled |
| ReconciliationStatus | Pending, AutoReconciled, Suggested, ManuallyReconciled, Discarded |
| MessageStatus | Pending, Sent, Delivered, Read, Failed |
| DocumentType | Ci, Dni, Passport, ForeignerId, Rut, Cpf, Other |
| GarmentType | TShirt, Singlet |
| Sex | Female, Male |
| OptInSource | Form, Imported, Manual |
| PaymentSource | Statement, Receipt, Manual, Webhook |
| ReconciliationRule | None, TransactionNumber, AmountAndPayer, Manual |
| ImportRowResult | Accepted, Corrected, InReview, Duplicate, Rejected |
| ParticipationResult | Finished, Dropped, NoShow |
| UserRole | Admin, Cashier, KitStaff, ReadOnly |
| MessageDirection | Inbound, Outbound |
| WhatsAppContentType | Text, Image, Audio, Video, Document, Sticker, Location, Contact, Reaction, Button, Template, Unsupported |
| MoneySportMovementType | Credit, Debit |

## Tables

Athletes, AuditRecords, Campaigns, AgeCategories, Settings, WhatsAppConversations, AthleteAccounts, KitDeliveries,
ModalityEquivalences, Events, AthleteImportRows, Languages, Registrations, KitItems, KitComposition, Kits,
AthleteImportBatches, StatementImportBatches, Brands, CampaignMessages, WhatsAppMessages, Modalities,
StatementMovements, MoneySportMovements, Payments, AgeCategoryTemplates, PaymentQrCodes, Segments, Sizes,
PriceTiers, Users.

## Columns

Columns use English names in the database and in the API, for example `RegistrationOpensAt`, `RegistrationClosesAt`,
`EventDate`, `AmountCents`, `PaymentToleranceCents`, `ServiceFeeCents`, `BibNumber`, `BibFrom`, `BibTo`, `MinAge`,
`MaxAge`, `DocumentNumber`, `PhoneCountryCode`, `PhoneNumber`, `WaiverAccepted`, `WaiverAcceptedAt`, `ReceiptPath`,
`TransactionNumber`, `Measure`, `RequiredSizeType` and `SortOrder`.
