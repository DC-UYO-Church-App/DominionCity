-- Tithe amounts must be positive.
--
-- `contributions` has carried CHECK (amount > 0) since it was created, but
-- `tithes` never did, and the controller passed the value through parseFloat
-- without validation — so negative and zero rows could be written and would
-- silently skew every total built on the table.
--
-- Existing bad rows are left in place deliberately: they are financial records
-- and deleting or rewriting them is the church's decision, not a migration's.
-- The constraint is added NOT VALID so it binds all future writes without
-- failing the deploy on historical data. Run
--   ALTER TABLE tithes VALIDATE CONSTRAINT chk_tithe_amount;
-- once the existing rows have been reviewed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tithe_amount'
  ) THEN
    ALTER TABLE tithes
      ADD CONSTRAINT chk_tithe_amount CHECK (amount > 0) NOT VALID;
  END IF;
END
$$;
