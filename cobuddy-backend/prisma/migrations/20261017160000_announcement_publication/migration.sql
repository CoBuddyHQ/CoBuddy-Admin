ALTER TABLE "Announcement"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Announcement"
SET
  "isPublished" = true,
  "publishedAt" = COALESCE("sentAt", "publishedAt")
WHERE "status" IN ('PUBLISHED', 'SENT');
