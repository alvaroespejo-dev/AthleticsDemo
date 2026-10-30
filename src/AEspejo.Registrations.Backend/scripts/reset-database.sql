-- Removes all data from the SQLite database and keeps the schema (tables and Flyway history).
--
-- Use it only on a local or demo database: it deletes every row, including users, events and registrations.
-- Run the seed scripts afterwards: seed-default-data.sql, then seed-demo-data.sql (optional).
--
-- Tables are listed children first, so the foreign keys are never violated.

BEGIN TRANSACTION;

DELETE FROM WhatsAppMessages;
DELETE FROM WhatsAppConversations;
DELETE FROM CampaignMessages;
DELETE FROM Campaigns;
DELETE FROM Segments;
DELETE FROM AuditRecords;
DELETE FROM AthleteImportRows;
DELETE FROM AthleteImportBatches;
DELETE FROM StatementMovements;
DELETE FROM StatementImportBatches;
DELETE FROM MoneySportMovements;
DELETE FROM Payments;
DELETE FROM KitDeliveries;
DELETE FROM Registrations;
DELETE FROM ModalityEquivalences;
DELETE FROM KitComposition;
DELETE FROM Kits;
DELETE FROM KitItems;
DELETE FROM AgeCategories;
DELETE FROM PaymentQrCodes;
DELETE FROM PriceTiers;
DELETE FROM Modalities;
DELETE FROM Events;
DELETE FROM AthleteAccounts;
DELETE FROM Athletes;
DELETE FROM AgeCategoryTemplates;
DELETE FROM Sizes;
DELETE FROM Languages;
DELETE FROM Settings;
DELETE FROM Users;
DELETE FROM Brands;

-- Restart the AUTOINCREMENT counters so the seeds get predictable ids.
DELETE FROM sqlite_sequence;

COMMIT;
