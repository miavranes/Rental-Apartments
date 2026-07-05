-- Rentura — Full Database Schema
-- Run: psql -U postgres -d rental_apartments -f backend/db/schema.sql

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                        SERIAL PRIMARY KEY,
  name                      VARCHAR(255)  NOT NULL,
  email                     VARCHAR(255)  NOT NULL UNIQUE,
  password_hash             VARCHAR(255)  NOT NULL,
  role                      VARCHAR(20)   NOT NULL DEFAULT 'tourist'
                              CHECK (role IN ('tourist', 'owner', 'admin')),
  phone                     VARCHAR(50),
  profile_image             VARCHAR(255),
  verification_code         VARCHAR(6),
  verification_code_expires TIMESTAMPTZ,
  is_verified               BOOLEAN       NOT NULL DEFAULT false,
  reset_token               VARCHAR(100),
  reset_token_expires       TIMESTAMPTZ,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Apartments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartments (
  id              SERIAL PRIMARY KEY,
  owner_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT,
  location        VARCHAR(255)  NOT NULL,
  address         VARCHAR(500),
  municipality    VARCHAR(255),
  country         VARCHAR(255),
  max_guests      INTEGER       NOT NULL DEFAULT 1  CHECK (max_guests >= 1),
  bedrooms        INTEGER       NOT NULL DEFAULT 1  CHECK (bedrooms >= 0),
  beds            INTEGER       NOT NULL DEFAULT 1  CHECK (beds >= 0),
  price_per_night NUMERIC(10,2) NOT NULL            CHECK (price_per_night >= 0),
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'on_arrival'
                    CHECK (payment_method IN ('on_arrival', 'online')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_owner_id    ON apartments(owner_id);
CREATE INDEX IF NOT EXISTS idx_apartments_location    ON apartments(LOWER(location));
CREATE INDEX IF NOT EXISTS idx_apartments_price       ON apartments(price_per_night);
CREATE INDEX IF NOT EXISTS idx_apartments_created_at  ON apartments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apartments_municipality ON apartments(LOWER(municipality));
CREATE INDEX IF NOT EXISTS idx_apartments_country     ON apartments(LOWER(country));

-- ─── Apartment Images ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartment_images (
  id           SERIAL PRIMARY KEY,
  apartment_id INTEGER       NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  image_url    VARCHAR(500)  NOT NULL,
  sort_order   INTEGER       NOT NULL DEFAULT 0,
  is_primary   BOOLEAN       NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_apt_images_apartment ON apartment_images(apartment_id);

-- ─── Amenities ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amenities (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100) NOT NULL UNIQUE
);

-- ─── Apartment ↔ Amenities pivot ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartment_amenities (
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  amenity_id   INTEGER NOT NULL REFERENCES amenities(id)  ON DELETE CASCADE,
  PRIMARY KEY (apartment_id, amenity_id)
);

-- ─── Reservations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                SERIAL PRIMARY KEY,
  apartment_id      INTEGER       NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id           INTEGER       NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  check_in          DATE          NOT NULL,
  check_out         DATE          NOT NULL,
  guests            INTEGER       NOT NULL CHECK (guests >= 1),
  total_price       NUMERIC(10,2) NOT NULL,
  payment_method    VARCHAR(20)   NOT NULL DEFAULT 'on_arrival'
                      CHECK (payment_method IN ('on_arrival', 'online')),
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  stripe_payment_id VARCHAR(255),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_reservations_apartment_id ON reservations(apartment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id      ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status       ON reservations(status);

-- ─── Blocked Dates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_dates (
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  date         DATE    NOT NULL,
  PRIMARY KEY (apartment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_apartment ON blocked_dates(apartment_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           SERIAL PRIMARY KEY,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id)   ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  reservation_id INTEGER      REFERENCES reservations(id)  ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_apartment ON reviews(apartment_id);

-- ─── Apartment Ratings (Materialized View) ───────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS apartment_ratings AS
  SELECT
    apartment_id,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating,
    COUNT(*)                        AS review_count
  FROM reviews
  GROUP BY apartment_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_apt_ratings_apt ON apartment_ratings(apartment_id);

-- Favorites / wishlist
CREATE TABLE IF NOT EXISTS favorites (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, apartment_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_apartment ON favorites(apartment_id);

-- Chat between guests and hosts
CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL PRIMARY KEY,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  tourist_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (apartment_id, tourist_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_tourist ON conversations(tourist_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
