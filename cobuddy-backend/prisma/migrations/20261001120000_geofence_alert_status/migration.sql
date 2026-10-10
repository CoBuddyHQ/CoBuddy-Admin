CREATE TYPE "GeofenceAlertStatus" AS ENUM ('INVESTIGATING', 'ESCALATED', 'RESOLVED');

ALTER TABLE "GeofenceAlertEvent"
ADD COLUMN "status" "GeofenceAlertStatus" NOT NULL DEFAULT 'INVESTIGATING';

UPDATE "GeofenceAlertEvent" SET "status" = 'RESOLVED' WHERE "seen" = true;
