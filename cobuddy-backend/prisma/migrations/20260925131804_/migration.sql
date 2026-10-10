-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('SUPER_ADMIN', 'MODERATOR', 'SAFETY_OPERATOR', 'FINANCE_ADMIN', 'SUPPORT_AGENT', 'SUPPORT_LEAD', 'LEGAL_ADMIN', 'CITY_OPS_MANAGER', 'HR_ADMIN');

-- CreateEnum
CREATE TYPE "EmployeeDepartment" AS ENUM ('TRUST_AND_SAFETY', 'SUPPORT', 'FINANCE', 'LEGAL', 'OPERATIONS', 'ENGINEERING', 'MANAGEMENT', 'HR');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "UserVerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_COMPANION_ACCEPT', 'REJECTED_BY_COMPANION', 'ARRIVING', 'IN_PROGRESS', 'EXTENDED', 'COMPLETED', 'CUSTOMER_CANCELLED', 'COMPANION_CANCELLED', 'COMPANION_EARLY_END', 'NO_SHOW_CUSTOMER', 'NO_SHOW_COMPANION', 'ADMIN_CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'ON_HOLD', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutMethodType" AS ENUM ('BANK', 'UPI');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletTransactionCategory" AS ENUM ('WALLET_TOPUP', 'BOOKING_CHARGE', 'BOOKING_REFUND', 'PLATFORM_FEE', 'PAYOUT', 'REFERRAL_BONUS', 'PROMO_CREDIT', 'DISPUTE_CREDIT', 'DISPUTE_DEBIT');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationMatchStatus" AS ENUM ('MATCHED', 'MISMATCHED', 'PENDING');

-- CreateEnum
CREATE TYPE "FraudFlagStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'DISMISSED', 'ACTION_TAKEN');

-- CreateEnum
CREATE TYPE "VerificationApplicantType" AS ENUM ('CUSTOMER', 'COMPANION');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_MANUAL_REVIEW', 'AUTO_APPROVED', 'AUTO_REJECTED', 'APPROVED', 'REJECTED', 'REQUEST_RESUBMISSION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ESCALATED_LEGAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "BanDuration" AS ENUM ('TEMPORARY_24H', 'TEMPORARY_7D', 'TEMPORARY_30D', 'PERMANENT');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'REVIEWING', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REMOVED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TicketEscalationLevel" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED_FALSE_ALARM', 'RESOLVED_REAL_INCIDENT', 'ESCALATED_AUTHORITIES');

-- CreateEnum
CREATE TYPE "GeofenceAlertType" AS ENUM ('ENTERED_RESTRICTED_ZONE', 'EXITED_CITY_LIMITS', 'STATIONARY_TOO_LONG', 'DEVIATED_FROM_ROUTE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('REQUEST', 'SESSION', 'SAFETY', 'PAYOUT', 'SUPPORT', 'POLICY', 'TRAINING', 'SYSTEM', 'WALLET', 'PROMOTION', 'REMINDER');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('CUISINE', 'ACTIVITY', 'LIFESTYLE');

-- CreateEnum
CREATE TYPE "ReviewTagPolarity" AS ENUM ('PRAISE', 'CONCERN');

-- CreateEnum
CREATE TYPE "ReviewTagAppliesTo" AS ENUM ('CUSTOMER_RATING_COMPANION', 'COMPANION_RATING_CUSTOMER', 'BOTH');

-- CreateEnum
CREATE TYPE "CancellationReasonAppliesTo" AS ENUM ('CUSTOMER_CANCEL', 'COMPANION_REJECT', 'COMPANION_CANCEL', 'COMPANION_EARLY_END', 'ANY');

-- CreateEnum
CREATE TYPE "KYCProvider" AS ENUM ('HYPERVERGE', 'IDFY', 'SIGNZY', 'KARZA');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "serviceHoursOpen" TEXT,
    "serviceHoursClose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "type" "InterestType" NOT NULL,
    "icon" TEXT,
    "basePriceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpokenLanguage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpokenLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppLanguage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationStyleOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationStyleOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPaceOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityPaceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionDurationOption" (
    "id" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionDurationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationCategoryOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationCategoryOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTagOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "polarity" "ReviewTagPolarity" NOT NULL,
    "appliesTo" "ReviewTagAppliesTo" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewTagOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeReason" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationReason" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "appliesTo" "CancellationReasonAppliesTo" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocumentType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYCDocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceTypeConfig" (
    "id" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "displayName" JSONB NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDefault" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "serviceHoursOpen" TEXT NOT NULL DEFAULT '08:00',
    "serviceHoursClose" TEXT NOT NULL DEFAULT '23:00',
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffEmployee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT NOT NULL,
    "department" "EmployeeDepartment" NOT NULL,
    "reportingManagerId" TEXT,
    "roles" "StaffRole"[],
    "cityScopeIds" TEXT[],
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "moduleAffected" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profilePicUrl" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "UserVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "flagsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "cityId" TEXT,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "spokenLanguageIds" TEXT[],
    "preferenceJson" JSONB,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profilePicUrl" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "UserVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "cityId" TEXT,
    "dob" TIMESTAMP(3),
    "gender" TEXT NOT NULL,
    "bio" TEXT,
    "headline" TEXT,
    "spokenLanguageIds" TEXT[],
    "interestIds" TEXT[],
    "communicationStyleCodes" TEXT[],
    "activityPaceCodes" TEXT[],
    "minSessionDurationMin" INTEGER,
    "maxSessionDurationMin" INTEGER,
    "pricingPerHourBase" DECIMAL(10,2),
    "payoutPreference" "PayoutMethodType",
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "upiId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreHistoryEntry" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "oldScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCategory" TEXT,
    "reportId" TEXT,
    "incidentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "name" TEXT NOT NULL,
    "placeType" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companionId" TEXT,
    "cityId" TEXT NOT NULL,
    "activityLabel" TEXT NOT NULL,
    "interestId" TEXT,
    "venueId" TEXT,
    "venueSnapshot" JSONB,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerCancelReasonId" TEXT,
    "companionCancelReasonId" TEXT,
    "adminCancelNote" TEXT,
    "bookingAmount" DECIMAL(10,2) NOT NULL,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "platformFeeAmount" DECIMAL(10,2) NOT NULL,
    "companionNetAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "walletTransactionId" TEXT,
    "escrowReleaseAt" TIMESTAMP(3),
    "extensionCount" INTEGER NOT NULL DEFAULT 0,
    "originalBookingId" TEXT,
    "sosTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAuditLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "disputeReasonId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "resolutionNote" TEXT,
    "refundAmount" DECIMAL(10,2),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "customerId" TEXT,
    "companionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ledgerVersion" INTEGER NOT NULL DEFAULT 0,
    "lastTopupAt" TIMESTAMP(3),
    "lastSpendAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "category" "WalletTransactionCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balanceAfter" DECIMAL(14,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "bookingId" TEXT,
    "payoutId" TEXT,
    "invoiceId" TEXT,
    "refundId" TEXT,
    "gatewayTxnId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "payoutRef" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "holdReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "utrNumber" TEXT,
    "gatewayPayoutId" TEXT,
    "failureMessage" TEXT,
    "paidByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedByType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "gatewayRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "companionId" TEXT,
    "bookingId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gstAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "pdfUrl" TEXT,
    "billingAddress" JSONB,
    "taxNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRecord" (
    "id" TEXT NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL,
    "gateway" TEXT NOT NULL,
    "internalTxnId" TEXT,
    "internalAmount" DECIMAL(12,2),
    "internalDate" TIMESTAMP(3),
    "gatewayTxnId" TEXT,
    "gatewayAmount" DECIMAL(12,2),
    "gatewayDate" TIMESTAMP(3),
    "matchStatus" "ReconciliationMatchStatus" NOT NULL DEFAULT 'PENDING',
    "mismatchNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "FraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "evidenceJson" JSONB,
    "assignedToId" TEXT,
    "actionsTaken" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCase" (
    "id" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "applicantType" "VerificationApplicantType" NOT NULL,
    "provider" "KYCProvider",
    "documentType" TEXT NOT NULL,
    "idDocumentUrl" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "backgroundDeclarationUrl" TEXT,
    "faceMatchScore" INTEGER,
    "livenessPass" BOOLEAN,
    "documentValid" BOOLEAN,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_MANUAL_REVIEW',
    "reviewNotes" TEXT,
    "reviewedByStaffId" TEXT,
    "autoRunAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAuditEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorId" TEXT,
    "notes" TEXT,

    CONSTRAINT "VerificationAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationThreshold" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "autoApproveThreshold" INTEGER NOT NULL DEFAULT 90,
    "autoRejectThreshold" INTEGER NOT NULL DEFAULT 30,
    "livenessRequired" BOOLEAN NOT NULL DEFAULT true,
    "enabledProvider" "KYCProvider" NOT NULL DEFAULT 'HYPERVERGE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionApplication" (
    "id" TEXT NOT NULL,
    "companionId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "cityId" TEXT NOT NULL,
    "cvUrl" TEXT,
    "portfolioUrls" TEXT[],
    "applicationStatus" TEXT NOT NULL,
    "reviewNotes" TEXT,
    "reviewedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reportRef" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reporterType" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reportedUserType" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "bookingId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reportId" TEXT,
    "duration" "BanDuration" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "bannedById" TEXT NOT NULL,
    "liftedAt" TIMESTAMP(3),
    "liftedById" TEXT,
    "liftReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "byCustomerId" TEXT NOT NULL,
    "toCompanionId" TEXT,
    "byCompanionId" TEXT,
    "toCustomerId" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "tagCodes" TEXT[],
    "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNote" TEXT,
    "moderatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBanAppeal" (
    "id" TEXT NOT NULL,
    "banId" TEXT NOT NULL,
    "appealReason" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "UserBanAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "alertRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "bookingId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "SOSStatus" NOT NULL DEFAULT 'TRIGGERED',
    "audioClipUrl" TEXT,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedNote" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "authoritiesContacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" TEXT NOT NULL,
    "incidentRef" TEXT NOT NULL,
    "incidentTypeCode" TEXT NOT NULL,
    "involvedCustomerIds" TEXT[],
    "involvedCompanionIds" TEXT[],
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "legalEscalation" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "preserveEvidence" BOOLEAN NOT NULL DEFAULT false,
    "assignedInvestigatorId" TEXT,
    "investigatorNotes" JSONB,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceZone" (
    "id" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    "boundaryGeoJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeofenceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceAlertEvent" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "alertType" "GeofenceAlertType" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeofenceAlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyWorkflowConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "acknowledgementSlaSeconds" INTEGER NOT NULL DEFAULT 30,
    "escalationSlaSeconds" INTEGER NOT NULL DEFAULT 300,
    "authoritiesContactIfNoResolveSeconds" INTEGER NOT NULL DEFAULT 600,
    "onCallTeamIds" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyWorkflowConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinorAgeEscalation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "status" TEXT NOT NULL,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinorAgeEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "customerId" TEXT,
    "companionId" TEXT,
    "categoryCode" TEXT NOT NULL,
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "escalationLevel" "TicketEscalationLevel" NOT NULL DEFAULT 'L1',
    "assignedToId" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "relatedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAuditEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "subject" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "channels" "NotificationChannel"[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDispatch" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffNotification" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRankingConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "trustScoreWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "ratingWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "responseTimeWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "acceptRateWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "sessionCompletionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "proximityBonusWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "minTrustScoreForTopPool" INTEGER NOT NULL DEFAULT 80,
    "minAcceptanceRatePercent" INTEGER NOT NULL DEFAULT 70,
    "newCompanionBoostPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryRankingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchmakingConfig" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "searchRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "maxCompanionSuggestions" INTEGER NOT NULL DEFAULT 10,
    "companionAcceptDeadlineMins" INTEGER NOT NULL DEFAULT 15,
    "autoRetryCount" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchmakingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialEvent" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "bannerUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discountPct" DOUBLE PRECISION,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveOn" TIMESTAMP(3) NOT NULL,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "requiredRole" "StaffRole",
    "contentUrl" TEXT NOT NULL,
    "quizJson" JSONB,
    "passPctReq" INTEGER NOT NULL DEFAULT 80,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPrivacyRequest" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusDetails" TEXT,
    "requestedFields" TEXT[],
    "fulfillmentUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataPrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRequest" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "caseReference" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "preserveUntil" TIMESTAMP(3) NOT NULL,
    "fulfillmentStatus" TEXT NOT NULL,
    "documentsUrl" TEXT,
    "approvedByLegalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "signupBonus" DECIMAL(10,2) NOT NULL,
    "refereeBonus" DECIMAL(10,2) NOT NULL,
    "maxUsages" INTEGER,
    "usagesCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "targetCityIds" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_cityCode_key" ON "City"("cityCode");

-- CreateIndex
CREATE INDEX "City_active_idx" ON "City"("active");

-- CreateIndex
CREATE INDEX "City_state_idx" ON "City"("state");

-- CreateIndex
CREATE INDEX "Area_cityId_active_idx" ON "Area"("cityId", "active");

-- CreateIndex
CREATE INDEX "Interest_type_active_idx" ON "Interest"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SpokenLanguage_code_key" ON "SpokenLanguage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AppLanguage_code_key" ON "AppLanguage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_code_key" ON "TicketCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentType_code_key" ON "IncidentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationStyleOption_code_key" ON "CommunicationStyleOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityPaceOption_code_key" ON "ActivityPaceOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDurationOption_minutes_key" ON "SessionDurationOption"("minutes");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationCategoryOption_code_key" ON "NotificationCategoryOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTagOption_code_key" ON "ReviewTagOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeReason_code_key" ON "DisputeReason"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationReason_code_key" ON "CancellationReason"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KYCDocumentType_code_key" ON "KYCDocumentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceTypeConfig_typeName_key" ON "PlaceTypeConfig"("typeName");

-- CreateIndex
CREATE UNIQUE INDEX "StaffEmployee_employeeId_key" ON "StaffEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffEmployee_email_key" ON "StaffEmployee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffEmployee_inviteToken_key" ON "StaffEmployee"("inviteToken");

-- CreateIndex
CREATE INDEX "StaffEmployee_email_idx" ON "StaffEmployee"("email");

-- CreateIndex
CREATE INDEX "StaffEmployee_status_idx" ON "StaffEmployee"("status");

-- CreateIndex
CREATE INDEX "StaffEmployee_department_idx" ON "StaffEmployee"("department");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_refreshToken_key" ON "StaffSession"("refreshToken");

-- CreateIndex
CREATE INDEX "StaffSession_employeeId_idx" ON "StaffSession"("employeeId");

-- CreateIndex
CREATE INDEX "StaffSession_expiresAt_idx" ON "StaffSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_timestamp_idx" ON "AuditLog"("adminId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_moduleAffected_timestamp_idx" ON "AuditLog"("moduleAffected", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_verificationStatus_idx" ON "Customer"("verificationStatus");

-- CreateIndex
CREATE INDEX "Customer_cityId_idx" ON "Customer"("cityId");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_email_key" ON "Companion"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_phone_key" ON "Companion"("phone");

-- CreateIndex
CREATE INDEX "Companion_status_idx" ON "Companion"("status");

-- CreateIndex
CREATE INDEX "Companion_cityId_idx" ON "Companion"("cityId");

-- CreateIndex
CREATE INDEX "Companion_verificationStatus_idx" ON "Companion"("verificationStatus");

-- CreateIndex
CREATE INDEX "Companion_trustScore_idx" ON "Companion"("trustScore" DESC);

-- CreateIndex
CREATE INDEX "BankAccount_companionId_idx" ON "BankAccount"("companionId");

-- CreateIndex
CREATE INDEX "TrustScoreHistoryEntry_companionId_date_idx" ON "TrustScoreHistoryEntry"("companionId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_googlePlaceId_key" ON "Venue"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Venue_cityId_idx" ON "Venue"("cityId");

-- CreateIndex
CREATE INDEX "Venue_placeType_idx" ON "Venue"("placeType");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Booking_companionId_createdAt_idx" ON "Booking"("companionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime" DESC);

-- CreateIndex
CREATE INDEX "Booking_cityId_status_idx" ON "Booking"("cityId", "status");

-- CreateIndex
CREATE INDEX "Booking_bookingRef_idx" ON "Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "SessionAuditLog_bookingId_timestamp_idx" ON "SessionAuditLog"("bookingId", "timestamp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDispute_bookingId_key" ON "BookingDispute"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDispute_status_idx" ON "BookingDispute"("status");

-- CreateIndex
CREATE INDEX "BookingDispute_createdAt_idx" ON "BookingDispute"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_customerId_key" ON "Wallet"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_companionId_key" ON "Wallet"("companionId");

-- CreateIndex
CREATE INDEX "Wallet_ownerType_balance_idx" ON "Wallet"("ownerType", "balance" DESC);

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WalletTransaction_bookingId_idx" ON "WalletTransaction"("bookingId");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_createdAt_idx" ON "WalletTransaction"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WalletTransaction_category_idx" ON "WalletTransaction"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_payoutRef_key" ON "Payout"("payoutRef");

-- CreateIndex
CREATE INDEX "Payout_companionId_periodStart_idx" ON "Payout"("companionId", "periodStart" DESC);

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_dueDate_idx" ON "Payout"("dueDate");

-- CreateIndex
CREATE INDEX "Payout_payoutRef_idx" ON "Payout"("payoutRef");

-- CreateIndex
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_invoiceNumber_key" ON "TaxInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "TaxInvoice_invoiceNumber_idx" ON "TaxInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "TaxInvoice_customerId_createdAt_idx" ON "TaxInvoice"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TaxInvoice_status_idx" ON "TaxInvoice"("status");

-- CreateIndex
CREATE INDEX "ReconciliationRecord_reconciliationDate_idx" ON "ReconciliationRecord"("reconciliationDate" DESC);

-- CreateIndex
CREATE INDEX "ReconciliationRecord_matchStatus_idx" ON "ReconciliationRecord"("matchStatus");

-- CreateIndex
CREATE INDEX "ReconciliationRecord_gateway_gatewayTxnId_idx" ON "ReconciliationRecord"("gateway", "gatewayTxnId");

-- CreateIndex
CREATE INDEX "ReconciliationRecord_internalTxnId_idx" ON "ReconciliationRecord"("internalTxnId");

-- CreateIndex
CREATE INDEX "FraudFlag_userId_userType_idx" ON "FraudFlag"("userId", "userType");

-- CreateIndex
CREATE INDEX "FraudFlag_status_idx" ON "FraudFlag"("status");

-- CreateIndex
CREATE INDEX "FraudFlag_category_createdAt_idx" ON "FraudFlag"("category", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCase_caseRef_key" ON "VerificationCase"("caseRef");

-- CreateIndex
CREATE INDEX "VerificationCase_applicantId_applicantType_idx" ON "VerificationCase"("applicantId", "applicantType");

-- CreateIndex
CREATE INDEX "VerificationCase_status_idx" ON "VerificationCase"("status");

-- CreateIndex
CREATE INDEX "VerificationCase_submittedAt_idx" ON "VerificationCase"("submittedAt" DESC);

-- CreateIndex
CREATE INDEX "VerificationCase_caseRef_idx" ON "VerificationCase"("caseRef");

-- CreateIndex
CREATE INDEX "VerificationAuditEvent_caseId_timestamp_idx" ON "VerificationAuditEvent"("caseId", "timestamp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CompanionApplication_companionId_key" ON "CompanionApplication"("companionId");

-- CreateIndex
CREATE INDEX "CompanionApplication_applicationStatus_createdAt_idx" ON "CompanionApplication"("applicationStatus", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CompanionApplication_cityId_idx" ON "CompanionApplication"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_reportRef_key" ON "UserReport"("reportRef");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_assignedToId_idx" ON "UserReport"("assignedToId");

-- CreateIndex
CREATE INDEX "UserReport_createdAt_idx" ON "UserReport"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserReport_reportRef_idx" ON "UserReport"("reportRef");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_reportedUserType_idx" ON "UserReport"("reportedUserId", "reportedUserType");

-- CreateIndex
CREATE INDEX "UserBan_userId_userType_idx" ON "UserBan"("userId", "userType");

-- CreateIndex
CREATE INDEX "UserBan_startsAt_idx" ON "UserBan"("startsAt" DESC);

-- CreateIndex
CREATE INDEX "Review_byCustomerId_idx" ON "Review"("byCustomerId");

-- CreateIndex
CREATE INDEX "Review_toCompanionId_idx" ON "Review"("toCompanionId");

-- CreateIndex
CREATE INDEX "Review_moderationStatus_idx" ON "Review"("moderationStatus");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_byCustomerId_toCompanionId_key" ON "Review"("bookingId", "byCustomerId", "toCompanionId");

-- CreateIndex
CREATE INDEX "UserBanAppeal_banId_idx" ON "UserBanAppeal"("banId");

-- CreateIndex
CREATE INDEX "UserBanAppeal_status_idx" ON "UserBanAppeal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SOSAlert_alertRef_key" ON "SOSAlert"("alertRef");

-- CreateIndex
CREATE INDEX "SOSAlert_status_createdAt_idx" ON "SOSAlert"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SOSAlert_userId_createdAt_idx" ON "SOSAlert"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SOSAlert_bookingId_idx" ON "SOSAlert"("bookingId");

-- CreateIndex
CREATE INDEX "SOSAlert_alertRef_idx" ON "SOSAlert"("alertRef");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyIncident_incidentRef_key" ON "SafetyIncident"("incidentRef");

-- CreateIndex
CREATE INDEX "SafetyIncident_status_idx" ON "SafetyIncident"("status");

-- CreateIndex
CREATE INDEX "SafetyIncident_incidentTypeCode_idx" ON "SafetyIncident"("incidentTypeCode");

-- CreateIndex
CREATE INDEX "SafetyIncident_legalEscalation_idx" ON "SafetyIncident"("legalEscalation");

-- CreateIndex
CREATE INDEX "SafetyIncident_createdAt_idx" ON "SafetyIncident"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "SafetyIncident_incidentRef_idx" ON "SafetyIncident"("incidentRef");

-- CreateIndex
CREATE INDEX "GeofenceZone_cityId_zoneType_idx" ON "GeofenceZone"("cityId", "zoneType");

-- CreateIndex
CREATE INDEX "GeofenceAlertEvent_seen_createdAt_idx" ON "GeofenceAlertEvent"("seen", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GeofenceAlertEvent_zoneId_createdAt_idx" ON "GeofenceAlertEvent"("zoneId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MinorAgeEscalation_status_idx" ON "MinorAgeEscalation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketRef_key" ON "SupportTicket"("ticketRef");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_status_idx" ON "SupportTicket"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_escalationLevel_idx" ON "SupportTicket"("escalationLevel");

-- CreateIndex
CREATE INDEX "SupportTicket_slaDeadline_idx" ON "SupportTicket"("slaDeadline");

-- CreateIndex
CREATE INDEX "SupportTicket_categoryCode_idx" ON "SupportTicket"("categoryCode");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketRef_idx" ON "SupportTicket"("ticketRef");

-- CreateIndex
CREATE INDEX "SupportTicket_customerId_idx" ON "SupportTicket"("customerId");

-- CreateIndex
CREATE INDEX "SupportTicket_companionId_idx" ON "SupportTicket"("companionId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketAuditEvent_ticketId_timestamp_idx" ON "TicketAuditEvent"("ticketId", "timestamp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_templateKey_key" ON "NotificationTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "NotificationDispatch_recipientId_recipientType_idx" ON "NotificationDispatch"("recipientId", "recipientType");

-- CreateIndex
CREATE INDEX "NotificationDispatch_createdAt_idx" ON "NotificationDispatch"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "NotificationDispatch_status_idx" ON "NotificationDispatch"("status");

-- CreateIndex
CREATE INDEX "StaffNotification_staffId_read_createdAt_idx" ON "StaffNotification"("staffId", "read", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MatchmakingConfig_cityId_key" ON "MatchmakingConfig"("cityId");

-- CreateIndex
CREATE INDEX "SpecialEvent_cityId_active_idx" ON "SpecialEvent"("cityId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_docKey_key" ON "PolicyDocument"("docKey");

-- CreateIndex
CREATE INDEX "PolicyDocument_docKey_effectiveOn_idx" ON "PolicyDocument"("docKey", "effectiveOn" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DataPrivacyRequest_requestRef_key" ON "DataPrivacyRequest"("requestRef");

-- CreateIndex
CREATE INDEX "DataPrivacyRequest_status_idx" ON "DataPrivacyRequest"("status");

-- CreateIndex
CREATE INDEX "DataPrivacyRequest_requestType_idx" ON "DataPrivacyRequest"("requestType");

-- CreateIndex
CREATE INDEX "DataPrivacyRequest_userId_userType_idx" ON "DataPrivacyRequest"("userId", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRequest_requestRef_key" ON "LegalRequest"("requestRef");

-- CreateIndex
CREATE INDEX "LegalRequest_fulfillmentStatus_idx" ON "LegalRequest"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "LegalRequest_preserveUntil_idx" ON "LegalRequest"("preserveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_configKey_key" ON "AppConfig"("configKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEmployee" ADD CONSTRAINT "StaffEmployee_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "StaffEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "StaffEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreHistoryEntry" ADD CONSTRAINT "TrustScoreHistoryEntry_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAuditLog" ADD CONSTRAINT "SessionAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDispute" ADD CONSTRAINT "BookingDispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAuditEvent" ADD CONSTRAINT "VerificationAuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "VerificationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionApplication" ADD CONSTRAINT "CompanionApplication_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_byCustomerId_fkey" FOREIGN KEY ("byCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_toCompanionId_fkey" FOREIGN KEY ("toCompanionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_byCompanionId_fkey" FOREIGN KEY ("byCompanionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_toCustomerId_fkey" FOREIGN KEY ("toCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceZone" ADD CONSTRAINT "GeofenceZone_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditEvent" ADD CONSTRAINT "TicketAuditEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchmakingConfig" ADD CONSTRAINT "MatchmakingConfig_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialEvent" ADD CONSTRAINT "SpecialEvent_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
