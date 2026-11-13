-- Default data for Atletics Demo (SQLite).
--
-- Inserts the global catalogs:
--   1. Brands (Brands)
--   2. Kit items (KitItems)
--   3. Sizes (Sizes)
--   4. Age category templates (AgeCategoryTemplates)
--   5. Organization settings, including the default liability waiver (Settings)
--
-- Run on an empty database (see reset-database.sql). Users are not created here: the application creates the
-- first administrator at startup from the INITIAL_ADMIN_PASSWORD environment variable.
--
-- Enum values used:
--   GarmentType (Sizes.Type, KitItems.RequiredSizeType): 1 = TShirt, 2 = Singlet (tights)

BEGIN TRANSACTION;

-- 1. Brands -------------------------------------------------------------------
-- Ids 1 and 2 are fixed: the backend uses them as defaults (Brand.ID_ECOTRAIL and Brand.ID_ONESPORT).
INSERT INTO Brands (Id, Code, Name, Active) VALUES
    (1, 'ecotrail', 'Atletics Demo', 1),
    (2, 'onesport', 'Atletics Demo', 1);

-- 2. Kit items ----------------------------------------------------------------
-- RequiredSizeType = 1 (TShirt) on "Official T-shirt": kits that include it require the athlete to choose a size.
INSERT INTO KitItems (Name, SortOrder, Active, RequiredSizeType) VALUES
    ('Official T-shirt',        0, 1, 1),
    ('Finisher medal',          1, 0, NULL),
    ('En-route hydration',      2, 0, NULL),
    ('Timing chip',             3, 0, NULL),
    ('Gift bag',                4, 0, NULL),
    ('Park entrance',           5, 0, NULL),
    ('Bib holder',              6, 0, NULL),
    ('First aid kit',           7, 0, NULL),
    ('Race photos',             8, 0, NULL),
    ('Runner insurance',        9, 0, NULL);

-- 3. Sizes --------------------------------------------------------------------
-- Type 1 = TShirt: adult sizes plus children's sizes 4 to 12.
-- Type 2 = Singlet (tights): adult sizes.
INSERT INTO Sizes (Measure, Type, SortOrder, Active) VALUES
    ('S',   1,  1, 1),
    ('M',   1,  2, 1),
    ('L',   1,  3, 1),
    ('XL',  1,  4, 1),
    ('2XL', 1,  5, 1),
    ('XS',  2,  6, 1),
    ('S',   2,  7, 1),
    ('M',   2,  8, 1),
    ('L',   2,  9, 1),
    ('XL',  2, 10, 1),
    ('2XL', 2, 11, 1),
    ('4',   1, 12, 1),
    ('6',   1, 13, 1),
    ('8',   1, 14, 1),
    ('10',  1, 15, 1),
    ('12',  1, 16, 1);

-- 4. Age category templates -----------------------------------------------------
-- Global age ranges. Each one applies to both women and men when an event is created.
-- The open-ended range uses 120 as its maximum.
INSERT INTO AgeCategoryTemplates (Name, MinAge, MaxAge, SortOrder) VALUES
    ('Open',      18,  30, 0),
    ('Master A',  31,  40, 1),
    ('Master B',  41,  50, 2),
    ('Veteran',   51, 120, 3);

-- 5. Organization settings and default liability waiver ----------------------------
-- Amounts are in cents: 4000 = USD 40 per finished race (Money Sport credit), 400 = USD 4 service fee.
INSERT INTO Settings (Id, OrganizationName, DefaultWaiverText, DefaultReservationHours,
                      DefaultPaymentToleranceCents, UpdatedAt, ServiceFeeCents, MoneySportAmountCents, GenericQrPath)
VALUES (1, 'Atletics Demo',
'I declare that I am taking part in this event freely and voluntarily.

I confirm that I am in suitable physical and health condition to complete the distance
I am registering for, and that I am not aware of any medical condition that would prevent
me from doing so. I accept that it is my responsibility to have undergone any medical
checks that may be required.

I release the organization, its sponsors and the event staff from all liability for
injuries, accidents, damage or loss that I may suffer before, during or after the race,
except for those resulting from willful misconduct or gross negligence of the organization.

I agree to respect the race rules, the marked course and the instructions of the
organization and safety staff. I understand that the organization may suspend or modify
the event due to force majeure or for safety reasons.

I authorize the use of my name and of images taken during the event for sports
promotion of this and future editions, without compensation.

I declare that the information I provide is true, and I authorize its processing for
organizing the event and delivering results.',
                      48, 0, '2026-10-26 09:00:00.000', 400, 4000, NULL);

COMMIT;
