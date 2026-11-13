-- Currency shown with every amount. Existing installations keep USD, the default.
ALTER TABLE "Settings" ADD COLUMN "CurrencyCode" varchar(3) NOT NULL DEFAULT 'USD';
