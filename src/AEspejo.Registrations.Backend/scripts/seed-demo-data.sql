-- Demo data for Atletics Demo (SQLite): three published events, their modalities, kits, prices and age
-- categories, and nine athletes with registrations and payments, so the panel and the landing are not empty.
--
-- Run after reset-database.sql and seed-default-data.sql. Demo data is not for production.
--
-- Enum values used:
--   EventStatus: 1 = Published
--   RegistrationStatus: 1 = Pending, 2 = Paid
--   Sex: 1 = Female, 2 = Male
--   DocumentType: 2 = Passport
--   OptInSource: 1 = Form
--   PaymentSource: 3 = Manual
--   ReconciliationRule: 0 = None

BEGIN TRANSACTION;

-- 1. Events (brand 2 = onesport) ------------------------------------------------
INSERT INTO Events (RegistrationOpensAt, SizeChangeClosesAt, RegistrationClosesAt, Description, Status, CreatedAt,
                    EventDate, ReservationHours, Location, BrandId, Name, RunnerManualName, ImagePath,
                    RunnerManualPath, Slug, WaiverText, PaymentToleranceCents, ServiceFeeCents)
VALUES
    ('2026-09-01 00:00:00.000', NULL, '2026-11-07 23:59:00.000',
     'An evening 5 km run through the city centre on a closed, lit circuit. Chip timing, water stations and a finish party.',
     1, '2026-10-26 09:00:00.000', '2026-11-08 00:00:00.000', 48, 'Santa Cruz de la Sierra', 2,
     'Downtown 5K Night Run', NULL, NULL, NULL, 'downtown-5k-night-run', NULL, 0, 400),
    ('2026-09-01 00:00:00.000', NULL, '2026-11-21 23:59:00.000',
     'A 10 km loop past the main squares and parks. Chip timing, a medical team at the finish and age-group awards.',
     1, '2026-10-26 09:00:00.000', '2026-11-22 00:00:00.000', 48, 'Cochabamba', 2,
     'City Loop 10K', NULL, NULL, NULL, 'city-loop-10k', NULL, 0, 400),
    ('2026-09-01 00:00:00.000', NULL, '2026-12-05 23:59:00.000',
     'A 21 km urban half marathon with a water station every five kilometres. Chip timing and a finisher medal.',
     1, '2026-10-26 09:00:00.000', '2026-12-06 00:00:00.000', 48, 'La Paz', 2,
     'Urban Half Marathon 21K', NULL, NULL, NULL, 'urban-half-marathon-21k', NULL, 0, 400);

-- 2. Modalities (one distance per event) -------------------------------------------
INSERT INTO Modalities (EventId, Name, DistanceMeters, Quota, SortOrder, MinAge, Active, BibFrom, BibTo)
SELECT Id, '5K', 5000, 300, 0, NULL, 1, NULL, NULL FROM Events WHERE Slug = 'downtown-5k-night-run'
UNION ALL
SELECT Id, '10K', 10000, 300, 0, NULL, 1, NULL, NULL FROM Events WHERE Slug = 'city-loop-10k'
UNION ALL
SELECT Id, '21K', 21097, 300, 0, NULL, 1, NULL, NULL FROM Events WHERE Slug = 'urban-half-marathon-21k';

-- 3. Price tiers (one general tier per modality, in cents) ----------------------------
INSERT INTO PriceTiers (ModalityId, Name, PriceCents, ValidFrom, ValidTo)
SELECT m.Id, 'General admission', 15000, '2026-09-01 00:00:00.000', '2026-12-31 23:59:59.000'
FROM Modalities m JOIN Events e ON e.Id = m.EventId WHERE e.Slug = 'downtown-5k-night-run'
UNION ALL
SELECT m.Id, 'General admission', 18000, '2026-09-01 00:00:00.000', '2026-12-31 23:59:59.000'
FROM Modalities m JOIN Events e ON e.Id = m.EventId WHERE e.Slug = 'city-loop-10k'
UNION ALL
SELECT m.Id, 'General admission', 26000, '2026-09-01 00:00:00.000', '2026-12-31 23:59:59.000'
FROM Modalities m JOIN Events e ON e.Id = m.EventId WHERE e.Slug = 'urban-half-marathon-21k';

-- 4. Kits: Standard (included items) and Premium (Standard plus medal and gift bag, USD 30 more) ------------
INSERT INTO Kits (Active, Description, ModalityId, Name, SortOrder, SurchargeCents, ImagePath)
SELECT 1, 'Race bib, timing chip and official T-shirt', m.Id, 'Standard', 0, 0, NULL
FROM Modalities m JOIN Events e ON e.Id = m.EventId
UNION ALL
SELECT 1, 'Standard kit plus finisher medal and gift bag', m.Id, 'Premium', 1, 3000, NULL
FROM Modalities m JOIN Events e ON e.Id = m.EventId;

INSERT INTO KitComposition (KitItemId, KitId)
SELECT ki.Id, k.Id FROM Kits k JOIN KitItems ki ON ki.Name IN ('Official T-shirt', 'Timing chip', 'Bib holder') WHERE k.Name = 'Standard'
UNION ALL
SELECT ki.Id, k.Id FROM Kits k JOIN KitItems ki ON ki.Name IN ('Official T-shirt', 'Timing chip', 'Bib holder', 'Finisher medal', 'Gift bag') WHERE k.Name = 'Premium';

-- 5. Age categories per event, for both sexes, from the global templates ----------------------------
INSERT INTO AgeCategories (EventId, Name, Sex, MinAge, MaxAge, ModalityId, SortOrder)
SELECT m.EventId, t.Name, s.Sex, t.MinAge, t.MaxAge, m.Id, t.SortOrder
FROM Modalities m
CROSS JOIN AgeCategoryTemplates t
CROSS JOIN (SELECT 1 AS Sex UNION ALL SELECT 2) s;

-- 6. Athletes (passport numbers are fictitious) ------------------------------------------------
INSERT INTO Athletes (Allergies, LastNames, PhoneCountryCode, PhoneNumber, PhoneOriginal, City, Club,
                      EmergencyContactName, EmergencyContactPhoneCountryCode, EmergencyContactPhoneNumber, Email,
                      UpdatedAt, UnsubscribedAt, CreatedAt, BirthDate, MarketingOptInAt, Nationality, FirstNames,
                      DocumentNumber, DocumentNumberOriginal, MarketingOptIn, OptInSource, Sex, DocumentType, BloodType)
VALUES
    (NULL, 'Carter',   '+1', '5125550101', NULL, 'Austin',   'Lone Star Runners', NULL, NULL, NULL, 'emily.carter@example.com',
     '2026-10-20 10:00:00.000', NULL, '2026-10-20 10:00:00.000', '1992-04-12 00:00:00.000', '2026-10-20 10:00:00.000', 'American', 'Emily', 'P1000001', 'P1000001', 1, 1, 1, 2, NULL),
    (NULL, 'Brooks',   '+1', '3035550102', NULL, 'Denver',   NULL, NULL, NULL, NULL, 'daniel.brooks@example.com',
     '2026-10-20 10:05:00.000', NULL, '2026-10-20 10:05:00.000', '1988-09-30 00:00:00.000', '2026-10-20 10:05:00.000', 'American', 'Daniel', 'P1000002', 'P1000002', 1, 1, 2, 2, NULL),
    (NULL, 'Martinez', '+1', '3055550103', NULL, 'Miami',    'Miami Trail Club', NULL, NULL, NULL, 'sophia.martinez@example.com',
     '2026-10-20 10:10:00.000', NULL, '2026-10-20 10:10:00.000', '1995-01-22 00:00:00.000', NULL, 'American', 'Sophia', 'P1000003', 'P1000003', 0, NULL, 1, 2, NULL),
    (NULL, 'Walker',   '+1', '2065550104', NULL, 'Seattle',  NULL, NULL, NULL, NULL, 'lucas.walker@example.com',
     '2026-10-20 10:15:00.000', NULL, '2026-10-20 10:15:00.000', '1979-07-08 00:00:00.000', '2026-10-20 10:15:00.000', 'American', 'Lucas', 'P1000004', 'P1000004', 1, 1, 2, 2, NULL),
    (NULL, 'Nguyen',   '+1', '7135550105', NULL, 'Houston',  NULL, NULL, NULL, NULL, 'olivia.nguyen@example.com',
     '2026-10-20 10:20:00.000', NULL, '2026-10-20 10:20:00.000', '1990-11-03 00:00:00.000', NULL, 'American', 'Olivia', 'P1000005', 'P1000005', 0, NULL, 1, 2, NULL),
    (NULL, 'Miller',   '+1', '3125550106', NULL, 'Chicago',  'Windy City Runners', NULL, NULL, NULL, 'ethan.miller@example.com',
     '2026-10-20 10:25:00.000', NULL, '2026-10-20 10:25:00.000', '1985-03-17 00:00:00.000', '2026-10-20 10:25:00.000', 'American', 'Ethan', 'P1000006', 'P1000006', 1, 1, 2, 2, NULL),
    (NULL, 'Johnson',  '+1', '6175550107', NULL, 'Boston',   NULL, NULL, NULL, NULL, 'ava.johnson@example.com',
     '2026-10-20 10:30:00.000', NULL, '2026-10-20 10:30:00.000', '1998-06-25 00:00:00.000', NULL, 'American', 'Ava', 'P1000007', 'P1000007', 0, NULL, 1, 2, NULL),
    (NULL, 'Wilson',   '+1', '5035550108', NULL, 'Portland', NULL, NULL, NULL, NULL, 'noah.wilson@example.com',
     '2026-10-20 10:35:00.000', NULL, '2026-10-20 10:35:00.000', '1973-12-09 00:00:00.000', '2026-10-20 10:35:00.000', 'American', 'Noah', 'P1000008', 'P1000008', 1, 1, 2, 2, NULL),
    (NULL, 'Garcia',   '+1', '6025550109', NULL, 'Phoenix',  'Desert Striders', NULL, NULL, NULL, 'isabella.garcia@example.com',
     '2026-10-20 10:40:00.000', NULL, '2026-10-20 10:40:00.000', '1993-08-14 00:00:00.000', '2026-10-20 10:40:00.000', 'American', 'Isabella', 'P1000009', 'P1000009', 1, 1, 1, 2, NULL);

-- 7. Registrations and payments -------------------------------------------------------------
-- Columns not listed take their defaults. Each row picks its athlete, event, kit, price tier and size by key.
INSERT INTO Registrations (WaiverAccepted, AthleteId, AcquisitionChannel, AgeCategoryId, Code, ReferralCode, BibNumber,
                           IsComplimentary, Status, EventId, CreatedAt, WaiverAcceptedAt, ReservationExpiresAt, PaidAt,
                           WaiverIp, KitId, ModalityId, AmountCents, Notes, SizeId, PriceTierId, ReceiptPath,
                           MoneySportDiscountCents, ResultAt, Result)
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0001', NULL, NULL, 0, 2, e.Id, '2026-10-24 12:00:00.000', '2026-10-24 12:00:00.000', NULL,
       '2026-10-24 15:00:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 15000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'M' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000001' AND e.Slug = 'downtown-5k-night-run'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0002', NULL, NULL, 0, 2, e.Id, '2026-10-24 12:30:00.000', '2026-10-24 12:30:00.000', NULL,
       '2026-10-24 16:10:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Premium'), m.Id, 18000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'L' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000002' AND e.Slug = 'downtown-5k-night-run'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Master A' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0003', NULL, NULL, 0, 1, e.Id, '2026-10-25 09:00:00.000', '2026-10-25 09:00:00.000', '2026-10-28 23:59:00.000',
       NULL, '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 15000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'S' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000003' AND e.Slug = 'downtown-5k-night-run'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0004', NULL, NULL, 0, 2, e.Id, '2026-10-22 18:00:00.000', '2026-10-22 18:00:00.000', NULL,
       '2026-10-22 19:30:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 18000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'L' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000004' AND e.Slug = 'city-loop-10k'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0005', NULL, NULL, 0, 1, e.Id, '2026-10-25 10:00:00.000', '2026-10-25 10:00:00.000', '2026-10-28 23:59:00.000',
       NULL, '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Premium'), m.Id, 21000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'M' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000005' AND e.Slug = 'city-loop-10k'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Master A' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0006', NULL, NULL, 0, 2, e.Id, '2026-10-23 08:15:00.000', '2026-10-23 08:15:00.000', NULL,
       '2026-10-23 09:00:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 18000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'XL' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000006' AND e.Slug = 'city-loop-10k'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0007', NULL, NULL, 0, 2, e.Id, '2026-10-21 11:00:00.000', '2026-10-21 11:00:00.000', NULL,
       '2026-10-21 12:20:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Premium'), m.Id, 29000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'S' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000007' AND e.Slug = 'urban-half-marathon-21k'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Veteran' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0008', NULL, NULL, 0, 1, e.Id, '2026-10-25 14:00:00.000', '2026-10-25 14:00:00.000', '2026-10-28 23:59:00.000',
       NULL, '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 26000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'L' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000008' AND e.Slug = 'urban-half-marathon-21k'
UNION ALL
SELECT 1, a.Id, 'Website',
       (SELECT ac.Id FROM AgeCategories ac WHERE ac.EventId = e.Id AND ac.Name = 'Open' AND ac.Sex = a.Sex LIMIT 1),
       'AD-0009', NULL, NULL, 0, 2, e.Id, '2026-10-24 17:00:00.000', '2026-10-24 17:00:00.000', NULL,
       '2026-10-24 17:40:00.000', '127.0.0.1',
       (SELECT k.Id FROM Kits k WHERE k.ModalityId = m.Id AND k.Name = 'Standard'), m.Id, 26000, NULL,
       (SELECT s.Id FROM Sizes s WHERE s.Measure = 'M' AND s.Type = 1), pt.Id, NULL, 0, NULL, NULL
FROM Athletes a, Events e
JOIN Modalities m ON m.EventId = e.Id
JOIN PriceTiers pt ON pt.ModalityId = m.Id
WHERE a.DocumentNumber = 'P1000009' AND e.Slug = 'urban-half-marathon-21k';

-- Payments for the paid registrations (manual entry, no bank statement).
INSERT INTO Payments (RegistrationId, TransactionNumber, AmountCents, CreditedAt, SourceBank, PayerName, Source, Rule,
                      ReceiptPath, SurplusCents, SourceData, RecordedAt, RecordedByUserId)
SELECT r.Id, 'AD-TX-' || r.Code, r.AmountCents, r.PaidAt, NULL, a.FirstNames || ' ' || a.LastNames, 3, 0,
       NULL, 0, NULL, r.PaidAt, NULL
FROM Registrations r JOIN Athletes a ON a.Id = r.AthleteId
WHERE r.Status = 2;

COMMIT;
