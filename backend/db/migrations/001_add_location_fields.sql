-- Run if apartments table already exists without municipality/country:
-- psql -U postgres -d rental_apartments -f backend/db/migrations/001_add_location_fields.sql

ALTER TABLE apartments ADD COLUMN IF NOT EXISTS municipality VARCHAR(255);
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS country VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_apartments_municipality ON apartments(LOWER(municipality));
CREATE INDEX IF NOT EXISTS idx_apartments_country ON apartments(LOWER(country));
