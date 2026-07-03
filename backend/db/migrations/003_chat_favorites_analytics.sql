CREATE TABLE IF NOT EXISTS favorites (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, apartment_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_apartment ON favorites(apartment_id);

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
