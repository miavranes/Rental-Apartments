-- Belt-and-suspenders protection against double-booked apartments.
-- The app already serializes booking requests with an advisory lock + transaction,
-- but this constraint guarantees at the database level that no two active
-- (pending/confirmed) reservations for the same apartment can ever overlap,
-- even if the app is buggy, restarted mid-request, or another process writes
-- to the table directly.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS date_range DATERANGE
    GENERATED ALWAYS AS (daterange(check_in, check_out, '[)')) STORED;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservations_no_overlap'
  ) THEN
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_no_overlap
      EXCLUDE USING gist (
        apartment_id WITH =,
        date_range WITH &&
      ) WHERE (status IN ('pending', 'confirmed'));
  END IF;
END $$;
