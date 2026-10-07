CREATE TYPE "BookingDisputeStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ESCALATED', 'REFUND_PENDING', 'RESOLVED_REFUND', 'RESOLVED_NO_REFUND', 'REFUND_REVIEW_REQUIRED');

ALTER TABLE "BookingDispute"
  ADD COLUMN "workflowStatus" "BookingDisputeStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "refundId" TEXT,
  ADD COLUMN "overridePercent" DOUBLE PRECISION,
  ADD COLUMN "overrideReason" TEXT;

-- Historical processed flags do not prove that a ledger credit occurred.
UPDATE "BookingDispute" SET "workflowStatus" = CASE
  WHEN "status" = 'PROCESSED' THEN 'REFUND_REVIEW_REQUIRED'::"BookingDisputeStatus"
  WHEN "status" = 'REJECTED' THEN 'RESOLVED_NO_REFUND'::"BookingDisputeStatus"
  WHEN "resolutionNote" LIKE '[ESCALATED]%' THEN 'ESCALATED'::"BookingDisputeStatus"
  WHEN "status" = 'APPROVED' THEN 'INVESTIGATING'::"BookingDisputeStatus"
  ELSE 'OPEN'::"BookingDisputeStatus"
END;

CREATE UNIQUE INDEX "BookingDispute_refundId_key" ON "BookingDispute"("refundId");
ALTER TABLE "BookingDispute" ADD CONSTRAINT "BookingDispute_refundId_fkey"
  FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
