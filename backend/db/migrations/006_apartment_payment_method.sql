ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'on_arrival'
    CHECK (payment_method IN ('on_arrival', 'online'));
