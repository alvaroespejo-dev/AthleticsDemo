-- Initial schema for AEspejo.Registrations on SQLite (the default database).
-- Same tables, columns and indexes as db/migration/postgresql/V1__initial_schema.sql. Types map as
-- timestamptz -> TIMESTAMP (stored as ISO-8601 text in UTC by sqlite-jdbc), boolean -> BOOLEAN, integer identity -> INTEGER PRIMARY KEY AUTOINCREMENT.
-- SQLite cannot add foreign keys after a table is created, so they are declared inside each CREATE TABLE.

CREATE TABLE "Athletes" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Allergies" varchar(1000),
    "LastNames" varchar(120) NOT NULL,
    "PhoneCountryCode" varchar(4) NOT NULL,
    "PhoneNumber" varchar(15) NOT NULL,
    "PhoneOriginal" varchar(40),
    "City" varchar(100),
    "Club" varchar(150),
    "EmergencyContactName" varchar(150),
    "EmergencyContactPhoneCountryCode" varchar(4),
    "EmergencyContactPhoneNumber" varchar(15),
    "Email" varchar(200),
    "UpdatedAt" TIMESTAMP NOT NULL,
    "UnsubscribedAt" TIMESTAMP,
    "CreatedAt" TIMESTAMP NOT NULL,
    "BirthDate" DATE NOT NULL,
    "MarketingOptInAt" TIMESTAMP,
    "Nationality" varchar(2),
    "FirstNames" varchar(120) NOT NULL,
    "DocumentNumber" varchar(30) NOT NULL,
    "DocumentNumberOriginal" varchar(50),
    "MarketingOptIn" BOOLEAN NOT NULL,
    "OptInSource" INTEGER,
    "Sex" INTEGER NOT NULL,
    "DocumentType" INTEGER NOT NULL,
    "BloodType" varchar(10)
);

CREATE TABLE "AuditRecords" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "TableName" varchar(100) NOT NULL,
    "RecordId" varchar(50) NOT NULL,
    "Operation" varchar(20) NOT NULL,
    "Changes" text NOT NULL,
    "UserId" INTEGER,
    "UserName" varchar(150),
    "IpAddress" varchar(64),
    "Date" TIMESTAMP NOT NULL
);

CREATE TABLE "Campaigns" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "CreatedByUserId" INTEGER NOT NULL,
    "Body" varchar(4000) NOT NULL,
    "Header" varchar(1000),
    "HeaderMediaUrl" varchar(2000),
    "Status" INTEGER NOT NULL,
    "EventId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL,
    "SentAt" TIMESTAMP,
    "ScheduledAt" TIMESTAMP,
    "FilterJson" varchar(4000) NOT NULL,
    "TemplateLanguage" varchar(10),
    "BrandId" INTEGER NOT NULL,
    "Name" varchar(200) NOT NULL,
    "TemplateName" varchar(150),
    "Provider" varchar(50),
    CONSTRAINT "FK_Campaigns_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Campaigns_Brands_BrandId" FOREIGN KEY ("BrandId") REFERENCES "Brands" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Campaigns_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AgeCategories" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EventId" INTEGER NOT NULL,
    "Name" varchar(100) NOT NULL,
    "Sex" INTEGER NOT NULL,
    "MinAge" INTEGER NOT NULL,
    "MaxAge" INTEGER NOT NULL,
    "ModalityId" INTEGER,
    "SortOrder" INTEGER NOT NULL,
    CONSTRAINT "FK_AgeCategories_Modalities_ModalityId" FOREIGN KEY ("ModalityId") REFERENCES "Modalities" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AgeCategories_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Settings" (
    "Id" INTEGER NOT NULL,
    "OrganizationName" varchar(200),
    "DefaultWaiverText" varchar(8000),
    "DefaultReservationHours" INTEGER NOT NULL,
    "DefaultPaymentToleranceCents" INTEGER NOT NULL,
    "UpdatedAt" TIMESTAMP NOT NULL,
    "ServiceFeeCents" INTEGER NOT NULL DEFAULT 400,
    "MoneySportAmountCents" INTEGER NOT NULL DEFAULT 4000,
    "GenericQrPath" varchar(500),
    CONSTRAINT "PK_Settings" PRIMARY KEY ("Id")
);

CREATE TABLE "WhatsAppConversations" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "BrandId" INTEGER NOT NULL,
    "PhoneE164" varchar(20) NOT NULL,
    "WaId" varchar(20) NOT NULL,
    "ProfileName" varchar(150),
    "AthleteId" INTEGER,
    "LastMessageAt" TIMESTAMP,
    "LastMessageSummary" varchar(150),
    "LastInboundMessageAt" TIMESTAMP,
    "UnreadCount" INTEGER NOT NULL,
    "Archived" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "FK_WhatsAppConversations_Brands_BrandId" FOREIGN KEY ("BrandId") REFERENCES "Brands" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_WhatsAppConversations_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AthleteAccounts" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Provider" varchar(30) NOT NULL,
    "ProviderSubject" varchar(300) NOT NULL,
    "Email" varchar(200) NOT NULL,
    "AthleteId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL,
    "LastAccessAt" TIMESTAMP NOT NULL,
    "LockedUntil" TIMESTAMP,
    "LinkAttempts" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FK_AthleteAccounts_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "KitDeliveries" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "RegistrationId" INTEGER NOT NULL,
    "DeliveredAt" TIMESTAMP NOT NULL,
    "UserId" INTEGER NOT NULL,
    "PickupPoint" varchar(100),
    "PickedUpBy" varchar(200),
    "Notes" varchar(1000),
    CONSTRAINT "FK_KitDeliveries_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_KitDeliveries_Registrations_RegistrationId" FOREIGN KEY ("RegistrationId") REFERENCES "Registrations" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "ModalityEquivalences" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "SourceText" varchar(100) NOT NULL,
    "EventId" INTEGER NOT NULL,
    "ModalityId" INTEGER NOT NULL,
    "AgeCategoryId" INTEGER,
    "KitId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "FK_ModalityEquivalences_Modalities_ModalityId" FOREIGN KEY ("ModalityId") REFERENCES "Modalities" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ModalityEquivalences_Kits_KitId" FOREIGN KEY ("KitId") REFERENCES "Kits" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ModalityEquivalences_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ModalityEquivalences_AgeCategories_AgeCategoryId" FOREIGN KEY ("AgeCategoryId") REFERENCES "AgeCategories" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Events" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "RegistrationOpensAt" TIMESTAMP NOT NULL,
    "SizeChangeClosesAt" TIMESTAMP,
    "RegistrationClosesAt" TIMESTAMP NOT NULL,
    "Description" varchar(2000),
    "Status" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "EventDate" DATE NOT NULL,
    "ReservationHours" INTEGER NOT NULL,
    "Location" varchar(200),
    "BrandId" INTEGER NOT NULL,
    "Name" varchar(200) NOT NULL,
    "RunnerManualName" varchar(200),
    "ImagePath" varchar(500),
    "RunnerManualPath" varchar(500),
    "Slug" varchar(80) NOT NULL,
    "WaiverText" varchar(8000),
    "PaymentToleranceCents" INTEGER NOT NULL,
    "ServiceFeeCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FK_Events_Brands_BrandId" FOREIGN KEY ("BrandId") REFERENCES "Brands" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AthleteImportRows" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "BatchId" INTEGER NOT NULL,
    "RowNumber" INTEGER NOT NULL,
    "RawRow" varchar(4000) NOT NULL,
    "Result" INTEGER NOT NULL,
    "Detail" varchar(1000),
    "AthleteId" INTEGER,
    "RegistrationId" INTEGER,
    "DuplicateAthleteId" INTEGER,
    CONSTRAINT "FK_AthleteImportRows_AthleteImportBatches_BatchId" FOREIGN KEY ("BatchId") REFERENCES "AthleteImportBatches" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AthleteImportRows_Registrations_RegistrationId" FOREIGN KEY ("RegistrationId") REFERENCES "Registrations" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AthleteImportRows_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Languages" (
    "Code" varchar(10) NOT NULL,
    "Name" varchar(100) NOT NULL,
    "Active" BOOLEAN NOT NULL,
    CONSTRAINT "PK_Languages" PRIMARY KEY ("Code")
);

CREATE TABLE "Registrations" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "WaiverAccepted" BOOLEAN NOT NULL,
    "AthleteId" INTEGER NOT NULL,
    "AcquisitionChannel" varchar(100),
    "AgeCategoryId" INTEGER,
    "Code" varchar(30) NOT NULL,
    "ReferralCode" varchar(50),
    "BibNumber" INTEGER,
    "IsComplimentary" BOOLEAN NOT NULL,
    "Status" INTEGER NOT NULL,
    "EventId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "WaiverAcceptedAt" TIMESTAMP,
    "ReservationExpiresAt" TIMESTAMP,
    "PaidAt" TIMESTAMP,
    "WaiverIp" varchar(64),
    "KitId" INTEGER NOT NULL,
    "ModalityId" INTEGER NOT NULL,
    "AmountCents" INTEGER NOT NULL,
    "Notes" varchar(2000),
    "SizeId" INTEGER,
    "PriceTierId" INTEGER,
    "ReceiptPath" varchar(500),
    "MoneySportDiscountCents" INTEGER NOT NULL DEFAULT 0,
    "ResultAt" TIMESTAMP,
    "Result" INTEGER,
    CONSTRAINT "FK_Registrations_PriceTiers_PriceTierId" FOREIGN KEY ("PriceTierId") REFERENCES "PriceTiers" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Registrations_Sizes_SizeId" FOREIGN KEY ("SizeId") REFERENCES "Sizes" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Registrations_Modalities_ModalityId" FOREIGN KEY ("ModalityId") REFERENCES "Modalities" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Registrations_Kits_KitId" FOREIGN KEY ("KitId") REFERENCES "Kits" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Registrations_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Registrations_AgeCategories_AgeCategoryId" FOREIGN KEY ("AgeCategoryId") REFERENCES "AgeCategories" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Registrations_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "KitItems" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Name" varchar(100) NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "Active" BOOLEAN NOT NULL,
    "RequiredSizeType" INTEGER
);

CREATE TABLE "KitComposition" (
    "KitItemId" INTEGER NOT NULL,
    "KitId" INTEGER NOT NULL,
    CONSTRAINT "PK_KitComposition" PRIMARY KEY ("KitItemId", "KitId"),
    CONSTRAINT "FK_KitComposition_Kits_KitId" FOREIGN KEY ("KitId") REFERENCES "Kits" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_KitComposition_KitItems_KitItemId" FOREIGN KEY ("KitItemId") REFERENCES "KitItems" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Kits" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Active" BOOLEAN NOT NULL,
    "Description" varchar(1000),
    "ModalityId" INTEGER NOT NULL,
    "Name" varchar(100) NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "SurchargeCents" INTEGER NOT NULL,
    "ImagePath" varchar(500),
    CONSTRAINT "FK_Kits_Modalities_ModalityId" FOREIGN KEY ("ModalityId") REFERENCES "Modalities" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AthleteImportBatches" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "FileName" varchar(300) NOT NULL,
    "EventId" INTEGER,
    "MappingJson" varchar(4000) NOT NULL,
    "ImportedAt" TIMESTAMP NOT NULL,
    "UserId" INTEGER NOT NULL,
    "RowsRead" INTEGER NOT NULL,
    "RowsAccepted" INTEGER NOT NULL,
    "RowsCorrected" INTEGER NOT NULL,
    "RowsInReview" INTEGER NOT NULL,
    "RowsDuplicated" INTEGER NOT NULL,
    "RowsRejected" INTEGER NOT NULL,
    CONSTRAINT "FK_AthleteImportBatches_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AthleteImportBatches_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "StatementImportBatches" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "FileName" varchar(300) NOT NULL,
    "BankProfile" varchar(50) NOT NULL,
    "ImportedAt" TIMESTAMP NOT NULL,
    "UserId" INTEGER NOT NULL,
    "RowsRead" INTEGER NOT NULL,
    "RowsImported" INTEGER NOT NULL,
    "RowsIgnored" INTEGER NOT NULL,
    CONSTRAINT "FK_StatementImportBatches_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Brands" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Code" varchar(30) NOT NULL,
    "Name" varchar(100) NOT NULL,
    "Active" BOOLEAN NOT NULL
);

CREATE TABLE "CampaignMessages" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "CampaignId" INTEGER NOT NULL,
    "AthleteId" INTEGER NOT NULL,
    "Phone" varchar(20) NOT NULL,
    "RenderedBody" varchar(4000) NOT NULL,
    "Status" INTEGER NOT NULL,
    "ExternalId" varchar(150),
    "Attempts" INTEGER NOT NULL,
    "LastError" varchar(1000),
    "SentAt" TIMESTAMP,
    "ParametersJson" varchar(4000),
    "RenderedHeader" varchar(1000),
    "HeaderParametersJson" varchar(4000),
    "HeaderImageUrl" varchar(2000),
    CONSTRAINT "FK_CampaignMessages_Campaigns_CampaignId" FOREIGN KEY ("CampaignId") REFERENCES "Campaigns" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CampaignMessages_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "WhatsAppMessages" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ConversationId" INTEGER NOT NULL,
    "Direction" INTEGER NOT NULL,
    "ExternalId" varchar(150),
    "ExternalRepliedId" varchar(150),
    "ContentType" INTEGER NOT NULL,
    "Text" varchar(4000),
    "MediaMetaId" varchar(150),
    "MediaFilePath" varchar(300),
    "MediaMimeType" varchar(150),
    "MediaFileName" varchar(300),
    "MediaSizeBytes" bigint,
    "MediaDownloaded" BOOLEAN NOT NULL,
    "DownloadAttempts" INTEGER NOT NULL,
    "Status" INTEGER NOT NULL,
    "Error" varchar(1000),
    "MessageAt" TIMESTAMP NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "SentByUserId" INTEGER,
    "TemplateName" varchar(150),
    CONSTRAINT "FK_WhatsAppMessages_Users_SentByUserId" FOREIGN KEY ("SentByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_WhatsAppMessages_WhatsAppConversations_ConversationId" FOREIGN KEY ("ConversationId") REFERENCES "WhatsAppConversations" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Modalities" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EventId" INTEGER NOT NULL,
    "Name" varchar(100) NOT NULL,
    "DistanceMeters" INTEGER NOT NULL,
    "Quota" INTEGER,
    "SortOrder" INTEGER NOT NULL,
    "MinAge" INTEGER,
    "Active" BOOLEAN NOT NULL,
    "BibFrom" INTEGER,
    "BibTo" INTEGER,
    CONSTRAINT "FK_Modalities_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE CASCADE
);

CREATE TABLE "StatementMovements" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "StatementBatchId" INTEGER NOT NULL,
    "TransactionNumber" varchar(100),
    "AmountCents" INTEGER NOT NULL,
    "MovementDate" TIMESTAMP NOT NULL,
    "PayerName" varchar(200),
    "Memo" varchar(500),
    "SourceBank" varchar(100),
    "Status" INTEGER NOT NULL,
    "Rule" INTEGER NOT NULL,
    "PaymentId" INTEGER,
    "SuggestedRegistrationId" INTEGER,
    "SuggestionScore" INTEGER,
    "RawRow" varchar(4000) NOT NULL,
    "DiscardReason" varchar(500),
    CONSTRAINT "FK_StatementMovements_Payments_PaymentId" FOREIGN KEY ("PaymentId") REFERENCES "Payments" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_StatementMovements_StatementImportBatches_StatementBatchId" FOREIGN KEY ("StatementBatchId") REFERENCES "StatementImportBatches" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_StatementMovements_Registrations_SuggestedRegistrationId" FOREIGN KEY ("SuggestedRegistrationId") REFERENCES "Registrations" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "MoneySportMovements" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "AthleteId" INTEGER NOT NULL,
    "RegistrationId" INTEGER NOT NULL,
    "Type" INTEGER NOT NULL,
    "AmountCents" INTEGER NOT NULL,
    "Date" TIMESTAMP NOT NULL,
    CONSTRAINT "FK_MoneySportMovements_Registrations_RegistrationId" FOREIGN KEY ("RegistrationId") REFERENCES "Registrations" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_MoneySportMovements_Athletes_AthleteId" FOREIGN KEY ("AthleteId") REFERENCES "Athletes" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Payments" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "RegistrationId" INTEGER NOT NULL,
    "TransactionNumber" varchar(100) NOT NULL,
    "AmountCents" INTEGER NOT NULL,
    "CreditedAt" TIMESTAMP NOT NULL,
    "SourceBank" varchar(100),
    "PayerName" varchar(200),
    "Source" INTEGER NOT NULL,
    "Rule" INTEGER NOT NULL,
    "ReceiptPath" varchar(500),
    "SurplusCents" INTEGER NOT NULL,
    "SourceData" varchar(8000),
    "RecordedAt" TIMESTAMP NOT NULL,
    "RecordedByUserId" INTEGER,
    CONSTRAINT "FK_Payments_Users_RecordedByUserId" FOREIGN KEY ("RecordedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Payments_Registrations_RegistrationId" FOREIGN KEY ("RegistrationId") REFERENCES "Registrations" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AgeCategoryTemplates" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Name" varchar(100) NOT NULL,
    "MinAge" INTEGER NOT NULL,
    "MaxAge" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL
);

CREATE TABLE "PaymentQrCodes" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "PriceTierId" INTEGER NOT NULL,
    "KitId" INTEGER NOT NULL,
    "ImagePath" varchar(500) NOT NULL,
    CONSTRAINT "FK_PaymentQrCodes_PriceTiers_PriceTierId" FOREIGN KEY ("PriceTierId") REFERENCES "PriceTiers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PaymentQrCodes_Kits_KitId" FOREIGN KEY ("KitId") REFERENCES "Kits" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Segments" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Name" varchar(200) NOT NULL,
    "Description" varchar(500),
    "FilterJson" varchar(4000) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP NOT NULL,
    "CreatedByUserId" INTEGER NOT NULL,
    CONSTRAINT "FK_Segments_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Sizes" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Measure" varchar(10) NOT NULL,
    "Type" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "Active" BOOLEAN NOT NULL
);

CREATE TABLE "PriceTiers" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ModalityId" INTEGER NOT NULL,
    "Name" varchar(100) NOT NULL,
    "PriceCents" INTEGER NOT NULL,
    "ValidFrom" TIMESTAMP NOT NULL,
    "ValidTo" TIMESTAMP NOT NULL,
    CONSTRAINT "FK_PriceTiers_Modalities_ModalityId" FOREIGN KEY ("ModalityId") REFERENCES "Modalities" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Users" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "LoginName" varchar(60) NOT NULL,
    "Name" varchar(150) NOT NULL,
    "Email" varchar(200),
    "PasswordHash" varchar(200) NOT NULL,
    "Role" INTEGER NOT NULL,
    "Active" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "LastAccessAt" TIMESTAMP,
    "PreferredLanguage" varchar(10) NOT NULL DEFAULT 'es'
);

-- Indexes
CREATE INDEX "IX_Athletes_PhoneCountryCode_PhoneNumber" ON "Athletes" ("PhoneCountryCode", "PhoneNumber");
CREATE INDEX "IX_Athletes_MarketingOptIn" ON "Athletes" ("MarketingOptIn");
CREATE UNIQUE INDEX "IX_Athletes_DocumentType_DocumentNumber" ON "Athletes" ("DocumentType", "DocumentNumber");
CREATE INDEX "IX_AuditRecords_Date" ON "AuditRecords" ("Date");
CREATE INDEX "IX_AuditRecords_TableName_RecordId" ON "AuditRecords" ("TableName", "RecordId");
CREATE INDEX "IX_Campaigns_CreatedByUserId" ON "Campaigns" ("CreatedByUserId");
CREATE INDEX "IX_Campaigns_Status" ON "Campaigns" ("Status");
CREATE INDEX "IX_Campaigns_EventId" ON "Campaigns" ("EventId");
CREATE INDEX "IX_Campaigns_BrandId" ON "Campaigns" ("BrandId");
CREATE INDEX "IX_AgeCategories_EventId_Sex_MinAge_MaxAge" ON "AgeCategories" ("EventId", "Sex", "MinAge", "MaxAge");
CREATE INDEX "IX_AgeCategories_ModalityId" ON "AgeCategories" ("ModalityId");
CREATE INDEX "IX_WhatsAppConversations_AthleteId" ON "WhatsAppConversations" ("AthleteId");
CREATE UNIQUE INDEX "IX_WhatsAppConversations_BrandId_PhoneE164" ON "WhatsAppConversations" ("BrandId", "PhoneE164");
CREATE INDEX "IX_WhatsAppConversations_BrandId_LastMessageAt" ON "WhatsAppConversations" ("BrandId", "LastMessageAt");
CREATE INDEX "IX_AthleteAccounts_AthleteId" ON "AthleteAccounts" ("AthleteId");
CREATE UNIQUE INDEX "IX_AthleteAccounts_Provider_ProviderSubject" ON "AthleteAccounts" ("Provider", "ProviderSubject");
CREATE UNIQUE INDEX "IX_KitDeliveries_RegistrationId" ON "KitDeliveries" ("RegistrationId");
CREATE INDEX "IX_KitDeliveries_UserId" ON "KitDeliveries" ("UserId");
CREATE INDEX "IX_ModalityEquivalences_AgeCategoryId" ON "ModalityEquivalences" ("AgeCategoryId");
CREATE UNIQUE INDEX "IX_ModalityEquivalences_EventId_SourceText" ON "ModalityEquivalences" ("EventId", "SourceText");
CREATE INDEX "IX_ModalityEquivalences_KitId" ON "ModalityEquivalences" ("KitId");
CREATE INDEX "IX_ModalityEquivalences_ModalityId" ON "ModalityEquivalences" ("ModalityId");
CREATE INDEX "IX_Events_EventDate" ON "Events" ("EventDate");
CREATE INDEX "IX_Events_BrandId_Status" ON "Events" ("BrandId", "Status");
CREATE UNIQUE INDEX "IX_Events_Slug" ON "Events" ("Slug");
CREATE INDEX "IX_AthleteImportRows_AthleteId" ON "AthleteImportRows" ("AthleteId");
CREATE INDEX "IX_AthleteImportRows_RegistrationId" ON "AthleteImportRows" ("RegistrationId");
CREATE INDEX "IX_AthleteImportRows_BatchId_Result" ON "AthleteImportRows" ("BatchId", "Result");
CREATE INDEX "IX_Registrations_AthleteId" ON "Registrations" ("AthleteId");
CREATE INDEX "IX_Registrations_AgeCategoryId" ON "Registrations" ("AgeCategoryId");
CREATE UNIQUE INDEX "IX_Registrations_Code" ON "Registrations" ("Code");
CREATE INDEX "IX_Registrations_EventId_AthleteId" ON "Registrations" ("EventId", "AthleteId");
CREATE UNIQUE INDEX "IX_Registrations_EventId_BibNumber" ON "Registrations" ("EventId", "BibNumber");
CREATE INDEX "IX_Registrations_EventId_Status_AmountCents" ON "Registrations" ("EventId", "Status", "AmountCents");
CREATE INDEX "IX_Registrations_ReservationExpiresAt" ON "Registrations" ("ReservationExpiresAt");
CREATE INDEX "IX_Registrations_KitId" ON "Registrations" ("KitId");
CREATE INDEX "IX_Registrations_ModalityId" ON "Registrations" ("ModalityId");
CREATE INDEX "IX_Registrations_SizeId" ON "Registrations" ("SizeId");
CREATE INDEX "IX_Registrations_PriceTierId" ON "Registrations" ("PriceTierId");
CREATE UNIQUE INDEX "IX_KitItems_Name" ON "KitItems" ("Name");
CREATE INDEX "IX_KitComposition_KitId" ON "KitComposition" ("KitId");
CREATE UNIQUE INDEX "IX_Kits_ModalityId_Name" ON "Kits" ("ModalityId", "Name");
CREATE INDEX "IX_AthleteImportBatches_EventId" ON "AthleteImportBatches" ("EventId");
CREATE INDEX "IX_AthleteImportBatches_UserId" ON "AthleteImportBatches" ("UserId");
CREATE INDEX "IX_StatementImportBatches_ImportedAt" ON "StatementImportBatches" ("ImportedAt");
CREATE INDEX "IX_StatementImportBatches_UserId" ON "StatementImportBatches" ("UserId");
CREATE UNIQUE INDEX "IX_Brands_Code" ON "Brands" ("Code");
CREATE INDEX "IX_CampaignMessages_AthleteId" ON "CampaignMessages" ("AthleteId");
CREATE UNIQUE INDEX "IX_CampaignMessages_CampaignId_AthleteId" ON "CampaignMessages" ("CampaignId", "AthleteId");
CREATE INDEX "IX_CampaignMessages_CampaignId_Status" ON "CampaignMessages" ("CampaignId", "Status");
CREATE INDEX "IX_WhatsAppMessages_ConversationId_MessageAt" ON "WhatsAppMessages" ("ConversationId", "MessageAt");
CREATE INDEX "IX_WhatsAppMessages_SentByUserId" ON "WhatsAppMessages" ("SentByUserId");
CREATE UNIQUE INDEX "IX_WhatsAppMessages_ExternalId" ON "WhatsAppMessages" ("ExternalId") WHERE "ExternalId" IS NOT NULL;
CREATE UNIQUE INDEX "IX_Modalities_EventId_Name" ON "Modalities" ("EventId", "Name");
CREATE INDEX "IX_StatementMovements_Status_AmountCents" ON "StatementMovements" ("Status", "AmountCents");
CREATE INDEX "IX_StatementMovements_MovementDate" ON "StatementMovements" ("MovementDate");
CREATE INDEX "IX_StatementMovements_SuggestedRegistrationId" ON "StatementMovements" ("SuggestedRegistrationId");
CREATE INDEX "IX_StatementMovements_StatementBatchId" ON "StatementMovements" ("StatementBatchId");
CREATE INDEX "IX_StatementMovements_TransactionNumber" ON "StatementMovements" ("TransactionNumber");
CREATE INDEX "IX_StatementMovements_PaymentId" ON "StatementMovements" ("PaymentId");
CREATE INDEX "IX_MoneySportMovements_AthleteId" ON "MoneySportMovements" ("AthleteId");
CREATE UNIQUE INDEX "IX_MoneySportMovements_RegistrationId_Type" ON "MoneySportMovements" ("RegistrationId", "Type");
CREATE INDEX "IX_Payments_CreditedAt" ON "Payments" ("CreditedAt");
CREATE INDEX "IX_Payments_RegistrationId" ON "Payments" ("RegistrationId");
CREATE UNIQUE INDEX "IX_Payments_TransactionNumber" ON "Payments" ("TransactionNumber");
CREATE INDEX "IX_Payments_RecordedByUserId" ON "Payments" ("RecordedByUserId");
CREATE UNIQUE INDEX "IX_AgeCategoryTemplates_Name" ON "AgeCategoryTemplates" ("Name");
CREATE INDEX "IX_PaymentQrCodes_KitId" ON "PaymentQrCodes" ("KitId");
CREATE UNIQUE INDEX "IX_PaymentQrCodes_PriceTierId_KitId" ON "PaymentQrCodes" ("PriceTierId", "KitId");
CREATE INDEX "IX_Segments_CreatedByUserId" ON "Segments" ("CreatedByUserId");
CREATE UNIQUE INDEX "IX_Segments_Name" ON "Segments" ("Name");
CREATE UNIQUE INDEX "IX_Sizes_Measure_Type" ON "Sizes" ("Measure", "Type");
CREATE INDEX "IX_PriceTiers_ModalityId_ValidFrom_ValidTo" ON "PriceTiers" ("ModalityId", "ValidFrom", "ValidTo");
CREATE UNIQUE INDEX "IX_Users_LoginName" ON "Users" ("LoginName");
