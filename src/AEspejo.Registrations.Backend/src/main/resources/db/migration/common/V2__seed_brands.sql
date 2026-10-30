-- Reference data every database needs before the panel can create events: the two brands.
-- Shared by PostgreSQL and SQLite, and idempotent, so it does nothing on databases that already have them.

INSERT INTO "Brands" ("Code", "Name", "Active")
SELECT 'ecotrail', 'EcoTrail Bolivia', TRUE
WHERE NOT EXISTS (SELECT 1 FROM "Brands" WHERE "Code" = 'ecotrail');

INSERT INTO "Brands" ("Code", "Name", "Active")
SELECT 'onesport', 'OneSport', TRUE
WHERE NOT EXISTS (SELECT 1 FROM "Brands" WHERE "Code" = 'onesport');
