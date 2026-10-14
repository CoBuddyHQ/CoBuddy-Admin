-- Existing applications keep null interview details; no appointment data is fabricated.
ALTER TABLE "CompanionApplication"
  ADD COLUMN "interviewScheduledAt" TIMESTAMP(3),
  ADD COLUMN "interviewerStaffId" TEXT,
  ADD COLUMN "interviewMeetingLink" TEXT;

CREATE INDEX "CompanionApplication_interviewerStaffId_idx"
  ON "CompanionApplication"("interviewerStaffId");

ALTER TABLE "CompanionApplication"
  ADD CONSTRAINT "CompanionApplication_interviewerStaffId_fkey"
  FOREIGN KEY ("interviewerStaffId") REFERENCES "StaffEmployee"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
