-- Adds configurable check-in / check-out times per listing.
-- Used to determine exactly when a stay is considered "completed" (and a
-- review can be left) instead of relying on the check-out date alone.

ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS check_in_time  TIME NOT NULL DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time TIME NOT NULL DEFAULT '11:00';