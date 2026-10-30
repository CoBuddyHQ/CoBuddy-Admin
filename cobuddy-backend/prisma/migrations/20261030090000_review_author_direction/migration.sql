-- Allow a review to be authored by either a customer or a companion.
-- Existing review rows and their identities are preserved.
ALTER TABLE "Review"
  ALTER COLUMN "byCustomerId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Review"
    WHERE "byCompanionId" IS NOT NULL
      AND "toCustomerId" IS NOT NULL
    GROUP BY "bookingId", "byCompanionId", "toCustomerId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate companion-authored reviews exist; reconcile them before applying this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "Review_bookingId_byCompanionId_toCustomerId_key"
  ON "Review"("bookingId", "byCompanionId", "toCustomerId");

CREATE INDEX "Review_byCompanionId_idx" ON "Review"("byCompanionId");
CREATE INDEX "Review_toCustomerId_idx" ON "Review"("toCustomerId");
