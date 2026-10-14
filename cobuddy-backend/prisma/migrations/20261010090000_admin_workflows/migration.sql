-- DropIndex
DROP INDEX "PolicyDocument_docKey_key";

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "categoryI18n" JSONB,
ADD COLUMN     "nameI18n" JSONB;

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SpecialEvent" ADD COLUMN     "linkedCategory" TEXT;

-- AlterTable
ALTER TABLE "PolicyDocument" ADD COLUMN     "contentI18n" JSONB,
ADD COLUMN     "publishStatus" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "titleI18n" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'SAFETY',
ADD COLUMN     "contentI18n" JSONB,
ADD COLUMN     "publishStatus" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "titleI18n" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DataPrivacyRequest" ADD COLUMN     "exportJson" JSONB,
ADD COLUMN     "legalHold" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LegalRequest" ADD COLUMN     "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "internalNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "targetUserType" TEXT NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "CityLaunch" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "targetLaunchDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "managerName" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityLaunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionPromotion" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "promotedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyConsent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastDelivery" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerId" TEXT,
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityLaunch_cityId_key" ON "CityLaunch"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_cityId_key" ON "WaitlistEntry"("email", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanionPromotion_companionId_key" ON "CompanionPromotion"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyConsent_documentId_userId_userType_key" ON "PolicyConsent"("documentId", "userId", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCompletion_moduleId_userId_userType_key" ON "TrainingCompletion"("moduleId", "userId", "userType");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_status_idx" ON "BroadcastDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastDelivery_announcementId_recipientId_recipientType_key" ON "BroadcastDelivery"("announcementId", "recipientId", "recipientType");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_docKey_version_key" ON "PolicyDocument"("docKey", "version");

-- AddForeignKey
ALTER TABLE "CityLaunch" ADD CONSTRAINT "CityLaunch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionPromotion" ADD CONSTRAINT "CompanionPromotion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyConsent" ADD CONSTRAINT "PolicyConsent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the publication state of existing content; new content defaults to draft.
UPDATE "PolicyDocument" SET "publishStatus" = 'PUBLISHED' WHERE "publishedBy" IS NOT NULL;
UPDATE "TrainingModule" SET "publishStatus" = 'PUBLISHED' WHERE "active" = true;
UPDATE "LegalRequest" SET "documentUrls" = ARRAY["documentsUrl"] WHERE "documentsUrl" IS NOT NULL AND "documentsUrl" <> '';
UPDATE "LegalRequest" SET "targetUserType" = 'COMPANION' WHERE EXISTS (SELECT 1 FROM "Companion" WHERE "id" = "LegalRequest"."targetUserId") AND NOT EXISTS (SELECT 1 FROM "Customer" WHERE "id" = "LegalRequest"."targetUserId");
ALTER TABLE "PolicyDocument" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrainingModule" ALTER COLUMN "updatedAt" DROP DEFAULT;
