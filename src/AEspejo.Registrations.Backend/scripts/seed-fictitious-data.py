#!/usr/bin/env python3
"""Fills an empty Atletics Demo SQLite database with fictitious data, so the panel and the landing are not empty.

It reuses the SQL of seed-default-data.sql (catalogs and organization settings) and seed-demo-data.sql (three
events, athletes, registrations and payments). The events are attached to the 'ecotrail' brand (Atletics Demo) and
their dates are moved into the future.

Usage (from src/AEspejo.Registrations.Backend):
    python scripts/seed-fictitious-data.py App_Data/registrations.db

Safe to run twice: it does nothing when the database already has events, and it only inserts the catalogs and
settings when those tables are empty. Start the application once first, so Flyway creates the schema and brands.
Demo data only: never run it against a production database that already has real records.
"""

import pathlib
import re
import sqlite3
import sys

HERE = pathlib.Path(__file__).resolve().parent

# Demo event dates are moved from 2026 into 2027 so the events are still upcoming.
DATE_MOVES = {
    "2026-11-07 23:59:00.000": "2026-12-20 23:59:00.000",
    "2026-11-08 00:00:00.000": "2026-12-21 00:00:00.000",
    "2026-11-21 23:59:00.000": "2027-01-16 23:59:00.000",
    "2026-11-22 00:00:00.000": "2027-01-17 00:00:00.000",
    "2026-12-05 23:59:00.000": "2027-02-06 23:59:00.000",
    "2026-12-06 00:00:00.000": "2027-02-07 00:00:00.000",
}


def read_sql(name: str) -> str:
    return (HERE / name).read_text(encoding="utf-8")


def catalog_block(default_sql: str) -> str:
    """Kit items, sizes and age category templates (not the brands: Flyway owns them, nor the settings)."""
    start = default_sql.index("-- 2. Kit items")
    end = default_sql.index("-- 5. Organization settings")
    return default_sql[start:end]


def default_waiver(default_sql: str) -> str:
    match = re.search(r"VALUES \(1, 'Atletics Demo',\s*'(.*?)',\s*48,", default_sql, re.S)
    if match is None:
        raise SystemExit("Could not read the default waiver from seed-default-data.sql.")
    return match.group(1).replace("''", "'")


def apply_settings(con: sqlite3.Connection, default_sql: str) -> None:
    """The application creates a Settings row with placeholder values at startup. Fill it in, keeping its amounts."""
    waiver = default_waiver(default_sql)
    if count(con, "Settings") == 0:
        start = default_sql.index("-- 5. Organization settings")
        end = default_sql.rindex("COMMIT;")
        con.executescript("BEGIN;" + default_sql[start:end] + "COMMIT;")
        return
    con.execute("UPDATE Settings SET OrganizationName = 'Atletics Demo' "
                "WHERE Id = 1 AND (OrganizationName IS NULL OR OrganizationName = '')")
    con.execute("UPDATE Settings SET DefaultWaiverText = ? WHERE Id = 1 AND LENGTH(DefaultWaiverText) < 200",
                (waiver,))
    con.commit()


def events_block(demo_sql: str) -> str:
    """Events, modalities, prices, kits, age categories, athletes, registrations and payments."""
    body = demo_sql[demo_sql.index("-- 1. Events") : demo_sql.rindex("COMMIT;")]
    # The demo events use BrandId 2 (OneSport); point them at the Atletics Demo brand instead.
    body = re.sub(
        r"(, '(?:Santa Cruz de la Sierra|Cochabamba|La Paz)', )2,",
        r"\g<1>(SELECT Id FROM Brands WHERE Code = 'ecotrail'),",
        body,
    )
    for old, new in DATE_MOVES.items():
        body = body.replace(old, new)
    return body


def count(con: sqlite3.Connection, table: str) -> int:
    return con.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]


def main(db_path: str) -> int:
    con = sqlite3.connect(db_path)
    try:
        if count(con, "Events") > 0:
            print("The database already has events; nothing to do.")
            return 0

        if con.execute("SELECT 1 FROM Brands WHERE Code = 'ecotrail'").fetchone() is None:
            print("Brand 'ecotrail' is missing. Start the application once so Flyway creates it, then run again.")
            return 1

        default_sql = read_sql("seed-default-data.sql")
        apply_settings(con, default_sql)

        script = ""
        if all(count(con, t) == 0 for t in ("KitItems", "Sizes", "AgeCategoryTemplates")):
            script += catalog_block(default_sql)
        else:
            print("Catalogs already exist: only the events are inserted.")

        script += events_block(read_sql("seed-demo-data.sql"))

        try:
            con.executescript("BEGIN;" + script + "COMMIT;")
        except sqlite3.Error:
            con.rollback()
            raise

        for table in ("Settings", "KitItems", "Sizes", "AgeCategoryTemplates", "Events", "Modalities",
                      "PriceTiers", "Kits", "AgeCategories", "Athletes", "Registrations", "Payments"):
            print(f"{table}: {count(con, table)}")
        return 0
    finally:
        con.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
