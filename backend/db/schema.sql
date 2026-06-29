-- Rentura — PostgreSQL schema
-- Run once after creating the database:
--   createdb rental_apartments
--   psql -U postgres -d rental_apartments -f backend/db/schema.sql
--   psql -U postgres -d rental_apartments -f backend/db/seedAmenities.sql

BEGIN;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                        SERIAL PRIMARY KEY,
  name                      VARCHAR(255) NOT NULL,
  email                     VARCHAR(255) NOT NULL UNIQUE,
  password_hash             VARCHAR(255) NOT NULL,
  role                      VARCHAR(20)  NOT NULL DEFAULT 'tourist'
                            CHECK (role IN ('tourist', 'owner', 'admin')),
  phone                     VARCHAR(50),
  profile_image             VARCHAR(255),
  verification_code         VARCHAR(6),
  verification_code_expires TIMESTAMPTZ,
  is_verified               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Apartments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartments (
  id              SERIAL PRIMARY KEY,
  owner_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  location        VARCHAR(255) NOT NULL,
  municipality    VARCHAR(255),
  country         VARCHAR(255),
  address         VARCHAR(500),
  max_guests      INTEGER NOT NULL DEFAULT 1 CHECK (max_guests >= 1),
  bedrooms        INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  beds            INTEGER NOT NULL DEFAULT 1 CHECK (beds >= 0),
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
  lat             NUMERIC(10, 7),
  lng             NUMERIC(10, 7),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_owner_id   ON apartments(owner_id);
CREATE INDEX IF NOT EXISTS idx_apartments_location     ON apartments(LOWER(location));
CREATE INDEX IF NOT EXISTS idx_apartments_municipality ON apartments(LOWER(municipality));
CREATE INDEX IF NOT EXISTS idx_apartments_country      ON apartments(LOWER(country));
CREATE INDEX IF NOT EXISTS idx_apartments_price      ON apartments(price_per_night);
CREATE INDEX IF NOT EXISTS idx_apartments_created_at ON apartments(created_at DESC);

-- ─── Apartment images ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartment_images (
  id           SERIAL PRIMARY KEY,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  image_url    VARCHAR(500) NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_apartment_images_apartment_id ON apartment_images(apartment_id);

-- ─── Amenities ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amenities (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS apartment_amenities (
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  amenity_id   INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (apartment_id, amenity_id)
);

-- ─── Reservations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                SERIAL PRIMARY KEY,
  apartment_id      INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in          DATE NOT NULL,
  check_out         DATE NOT NULL,
  guests            INTEGER NOT NULL CHECK (guests >= 1),
  total_price       NUMERIC(10, 2) NOT NULL,
  payment_method    VARCHAR(20) NOT NULL DEFAULT 'on_arrival'
                    CHECK (payment_method IN ('on_arrival', 'online')),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  stripe_payment_id VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id      ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_apartment_id ON reservations(apartment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status       ON reservations(status);

-- ─── Blocked dates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_dates (
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  PRIMARY KEY (apartment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_apartment_date ON blocked_dates(apartment_id, date);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id             SERIAL PRIMARY KEY,
  apartment_id   INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id INTEGER NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_apartment_id ON reviews(apartment_id);

-- ─── Materialized view (avg rating per apartment) ────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS apartment_ratings AS
SELECT
  apartment_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*)::integer              AS review_count
FROM reviews
GROUP BY apartment_id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_apartment_ratings_apartment_id
  ON apartment_ratings(apartment_id);

COMMIT;

-- Initial populate (safe to re-run; view stays empty until first review)
REFRESH MATERIALIZED VIEW apartment_ratings;
