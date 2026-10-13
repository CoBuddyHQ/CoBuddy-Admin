# CoBuddy Backend - Database Schema (Prisma)

This document contains the **complete production Prisma schema**. Copy into `cobuddy-backend/prisma/schema.prisma`.

All interfaces match the frontend `types.ts` files 1:1 so no mapping is required.

---

## 1. Prisma Schema Generator & Datasource

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch", "views"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgcrypto, uuid_ossp]
}
```

---

## 2. Enums (Match Frontend Exactly)

```prisma
// ============================================================
// STAFF / AUTH ENUMS
// ============================================================
enum StaffRole {
  SUPER_ADMIN
  MODERATOR
  SAFETY_OPERATOR
  FINANCE_ADMIN
  SUPPORT_AGENT
  SUPPORT_LEAD
  LEGAL_ADMIN
  CITY_OPS_MANAGER
  HR_ADMIN
}

enum EmployeeDepartment {
  TRUST_AND_SAFETY
  SUPPORT
  FINANCE
  LEGAL
  OPERATIONS
  ENGINEERING
  MANAGEMENT
  HR
}

enum EmployeeStatus {
  ACTIVE
  SUSPENDED
}

enum InviteStatus {
  PENDING
  ACCEPTED
}

// ============================================================
// USER ENUMS
// ============================================================
enum UserVerificationStatus {
  VERIFIED
  PENDING
  REJECTED
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

// ============================================================
// BOOKING / SESSION ENUMS
// ============================================================
enum BookingStatus {
  PENDING_COMPANION_ACCEPT
  REJECTED_BY_COMPANION
  ARRIVING
  IN_PROGRESS
  EXTENDED
  COMPLETED
  CUSTOMER_CANCELLED
  COMPANION_CANCELLED
  COMPANION_EARLY_END
  NO_SHOW_CUSTOMER
  NO_SHOW_COMPANION
  ADMIN_CANCELLED
}

// ============================================================
// FINANCIAL ENUMS
// ============================================================
enum PayoutStatus {
  PENDING
  ON_HOLD
  PROCESSING
  PAID
  FAILED
}

enum PayoutMethodType {
  BANK
  UPI
}

enum TransactionType {
  CREDIT
  DEBIT
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum WalletTransactionCategory {
  WALLET_TOPUP
  BOOKING_CHARGE
  BOOKING_REFUND
  PLATFORM_FEE
  PAYOUT
  REFERRAL_BONUS
  PROMO_CREDIT
  DISPUTE_CREDIT
  DISPUTE_DEBIT
}

enum RefundStatus {
  REQUESTED
  APPROVED
  PROCESSED
  REJECTED
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  CANCELLED
}

enum ReconciliationMatchStatus {
  MATCHED
  MISMATCHED
  PENDING
}

enum FraudFlagStatus {
  OPEN
  INVESTIGATING
  DISMISSED
  ACTION_TAKEN
}

// ============================================================
// MODERATION ENUMS
// ============================================================
enum VerificationApplicantType {
  CUSTOMER
  COMPANION
}

enum VerificationStatus {
  PENDING_MANUAL_REVIEW
  AUTO_APPROVED
  AUTO_REJECTED
  APPROVED
  REJECTED
  REQUEST_RESUBMISSION
}

enum ReportStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  ESCALATED
}

enum IncidentStatus {
  OPEN
  INVESTIGATING
  ESCALATED_LEGAL
  CLOSED
}

enum BanDuration {
  TEMPORARY_24H
  TEMPORARY_7D
  TEMPORARY_30D
  PERMANENT
}

enum AppealStatus {
  OPEN
  REVIEWING
  APPROVED
  REJECTED
  CLOSED
}

enum ReviewModerationStatus {
  PENDING
  APPROVED
  REMOVED
  FLAGGED
}

// ============================================================
// SUPPORT ENUMS
// ============================================================
enum SupportTicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SupportTicketStatus {
  OPEN
  IN_PROGRESS
  PENDING_USER
  RESOLVED
  CLOSED
  ESCALATED
}

enum TicketEscalationLevel {
  L1
  L2
  L3
}

// ============================================================
// SAFETY ENUMS
// ============================================================
enum SOSStatus {
  TRIGGERED
  ACKNOWLEDGED
  INVESTIGATING
  RESOLVED_FALSE_ALARM
  RESOLVED_REAL_INCIDENT
  ESCALATED_AUTHORITIES
}

enum GeofenceAlertType {
  ENTERED_RESTRICTED_ZONE
  EXITED_CITY_LIMITS
  STATIONARY_TOO_LONG
  DEVIATED_FROM_ROUTE
}

// ============================================================
// COMMUNICATION ENUMS
// ============================================================
enum NotificationChannel {
  IN_APP
  PUSH
  EMAIL
  SMS
}

enum NotificationCategory {
  REQUEST
  SESSION
  SAFETY
  PAYOUT
  SUPPORT
  POLICY
  TRAINING
  SYSTEM
  WALLET
  PROMOTION
  REMINDER
}

// ============================================================
// MASTER DATA ENUMS
// ============================================================
enum InterestType {
  CUISINE
  ACTIVITY
  LIFESTYLE
}

enum ReviewTagPolarity {
  PRAISE
  CONCERN
}

enum ReviewTagAppliesTo {
  CUSTOMER_RATING_COMPANION
  COMPANION_RATING_CUSTOMER
  BOTH
}

enum CancellationReasonAppliesTo {
  CUSTOMER_CANCEL
  COMPANION_REJECT
  COMPANION_CANCEL
  COMPANION_EARLY_END
  ANY
}

enum KYCProvider {
  HYPERVERGE
  IDFY
  SIGNZY
  KARZA
}
```

---

## 3. Master Data Tables (Seed First)

These correspond to `modules/system/master-data/types.ts`.

```prisma
// ============================================================
// MASTER DATA - WIRE FIRST PER README
// ============================================================
model City {
  id                    String    @id @default(uuid())
  cityCode              String    @unique
  name                  Json      // { en: "Mumbai", hi: "मुंबई" }
  state                 String
  country               String    @default("India")
  active                Boolean   @default(true)
  lat                   Float?
  lng                   Float?
  serviceHoursOpen      String?   // e.g. "08:00" - overrides system default
  serviceHoursClose     String?   // e.g. "22:00"
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  areas                 Area[]
  venues                Venue[]
  customers             Customer[]       @relation("CustomerCity")
  companions            Companion[]      @relation("CompanionCity")
  staffScopedEmployees  StaffEmployee[]  @relation("EmployeeCityScope")

  @@index([active])
  @@index([state])
}

model Area {
  id        String   @id @default(uuid())
  cityId    String
  name      Json     // { en: "Bandra", hi: "बांद्रा" }
  active    Boolean  @default(true)
  lat       Float?
  lng       Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  city      City     @relation(fields: [cityId], references: [id], onDelete: Cascade)

  @@index([cityId, active])
}

model Interest {
  id                   String       @id @default(uuid())
  name                 Json         // { en, hi }
  type                 InterestType
  icon                 String?
  basePriceMultiplier  Float        @default(1.0)
  active               Boolean      @default(true)
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  @@index([type, active])
}

model SpokenLanguage {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AppLanguage {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TicketCategory {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json     // { en, hi }
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model IncidentType {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json     // { en, hi }
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CommunicationStyleOption {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ActivityPaceOption {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SessionDurationOption {
  id        String   @id @default(uuid())
  minutes   Int      @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model NotificationCategoryOption {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ReviewTagOption {
  id         String             @id @default(uuid())
  code       String             @unique
  label      Json
  polarity   ReviewTagPolarity
  appliesTo  ReviewTagAppliesTo
  active     Boolean            @default(true)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
}

model DisputeReason {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CancellationReason {
  id        String                       @id @default(uuid())
  code      String                       @unique
  label     Json
  appliesTo CancellationReasonAppliesTo
  active    Boolean                      @default(true)
  createdAt DateTime                     @default(now())
  updatedAt DateTime                     @updatedAt
}

model KYCDocumentType {
  id        String   @id @default(uuid())
  code      String   @unique
  label     Json
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PlaceTypeConfig {
  id           String   @id @default(uuid())
  typeName     String   @unique  // cafe, restaurant, park, bar, lodging...
  displayName  Json
  isAllowed    Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ============================================================
// SYSTEM DEFAULTS - Single row
// ============================================================
model SystemDefault {
  id               String   @id @default("singleton")
  defaultCurrency  String   @default("INR")
  defaultLanguage  String   @default("en")
  serviceHoursOpen String   @default("08:00")
  serviceHoursClose String  @default("23:00")
  platformFeePercent Float @default(20.0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## 4. Staff / Auth Tables

```prisma
// ============================================================
// STAFF / AUTH
// ============================================================
model StaffEmployee {
  id                  String         @id @default(uuid())
  employeeId          String         @unique // EMP-001
  name                String
  email               String         @unique
  passwordHash        String         // bcrypt
  phone               String?
  designation         String
  department          EmployeeDepartment
  reportingManagerId  String?
  reportingManager    StaffEmployee? @relation("EmployeeManager", fields: [reportingManagerId], references: [id])
  roles               StaffRole[]    // PostgreSQL array
  cityScopeIds        String[]       // For CITY_OPS_MANAGER
  status              EmployeeStatus @default(ACTIVE)
  twoFactorSecret     String?        // TOTP base32
  twoFactorEnabled    Boolean        @default(false)
  inviteToken         String?        @unique
  inviteExpiresAt     DateTime?
  inviteStatus        InviteStatus   @default(PENDING)
  lastLoginAt         DateTime?
  lastLoginIp         String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  subordinates        StaffEmployee[] @relation("EmployeeManager")
  assignedTickets     SupportTicket[] @relation("TicketAssignee")
  assignedReports     UserReport[]    @relation("ReportAssignee")
  assignedIncidents   SafetyIncident[] @relation("IncidentInvestigator")

  directReports       StaffEmployee[] @relation("EmployeeManager")
  cityScopeCities     City[]          @relation("EmployeeCityScope", references: [id])

  @@index([email])
  @@index([status])
  @@index([department])
}

model StaffSession {
  id           String        @id @default(uuid())
  employeeId   String
  refreshToken String        @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime      @default(now())

  employee     StaffEmployee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@index([expiresAt])
}

model AuditLog {
  id              String   @id @default(uuid())
  adminId         String
  adminName       String
  action          String   // LOGIN, UPDATE_CONFIG, BAN_USER, etc.
  moduleAffected  String   // "Matchmaking", "User Moderation", ...
  details         String?
  ipAddress       String?
  userAgent       String?
  resourceType    String?  // e.g. "Customer", "Booking"
  resourceId      String?
  oldValues       Json?    // before image
  newValues       Json?    // after image
  timestamp       DateTime @default(now())

  @@index([adminId, timestamp(sort: Desc)])
  @@index([moduleAffected, timestamp(sort: Desc)])
  @@index([timestamp(sort: Desc)])
  @@index([resourceType, resourceId])
}
```

---

## 5. Customers & Companions

```prisma
// ============================================================
// CUSTOMERS
// ============================================================
model Customer {
  id                  String                  @id @default(uuid())
  name                String
  email               String?                 @unique
  phone               String                  @unique
  passwordHash        String
  profilePicUrl       String?
  joinDate            DateTime                @default(now())
  verificationStatus  UserVerificationStatus  @default(PENDING)
  totalBookings       Int                     @default(0)
  walletBalance       Decimal                 @default(0) @db.Decimal(12,2)
  flagsCount          Int                     @default(0)
  status              UserStatus              @default(ACTIVE)
  cityId              String?
  dob                 DateTime?
  gender              String?
  spokenLanguageIds   String[]
  preferenceJson      Json?
  lastActiveAt        DateTime                @default(now())
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  city                City?                   @relation("CustomerCity", fields: [cityId], references: [id])
  wallet              Wallet?
  bookings            Booking[]               @relation("CustomerBookings")
  bookingsAsReporter  UserReport[]            @relation("ReportReporter")
  tickets             SupportTicket[]         @relation("CustomerTickets")
  reviewsWritten      Review[]                @relation("ReviewByCustomer")
  reviewsReceived     Review[]                @relation("ReviewCustomerReceived")

  @@index([status])
  @@index([verificationStatus])
  @@index([cityId])
  @@index([phone])
}

// ============================================================
// COMPANIONS
// ============================================================
model Companion {
  id                      String                  @id @default(uuid())
  name                    String
  email                   String?                 @unique
  phone                   String                  @unique
  passwordHash            String
  profilePicUrl           String?
  joinDate                DateTime                @default(now())
  verificationStatus      UserVerificationStatus  @default(PENDING)
  trustScore              Int                     @default(50)
  totalEarnings           Decimal                 @default(0) @db.Decimal(12,2)
  totalSessions           Int                     @default(0)
  status                  UserStatus              @default(ACTIVE)
  cityId                  String?
  city                    City?                   @relation("CompanionCity", fields: [cityId], references: [id])
  dob                     DateTime?
  gender                  String
  bio                     String?
  headline                String?
  spokenLanguageIds       String[]
  interestIds             String[]
  communicationStyleCodes String[]
  activityPaceCodes       String[]
  minSessionDurationMin   Int?
  maxSessionDurationMin   Int?
  pricingPerHourBase      Decimal?                @db.Decimal(10,2)
  bankAccounts            BankAccount[]
  payoutPreference        PayoutMethodType?
  lastActiveAt            DateTime                @default(now())
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @default(now())

  wallet                  Wallet?
  bookings                Booking[]               @relation("CompanionBookings")
  payouts                 Payout[]
  trustScoreHistory       TrustScoreHistoryEntry[]
  reviewsWritten          Review[]                @relation("ReviewByCompanion")
  reviewsReceived         Review[]                @relation("ReviewCompanionReceived")
  tickets                 SupportTicket[]         @relation("CompanionTickets")
  applications            CompanionApplication[]

  @@index([status])
  @@index([cityId])
  @@index([verificationStatus])
  @@index([trustScore(sort: Desc)])
}

model BankAccount {
  id              String            @id @default(uuid())
  companionId     String
  accountName     String
  ifscCode        String
  accountNumber   String            // Encrypted
  accountLast4    String
  upiId           String?
  verified        Boolean           @default(false)
  preferred       Boolean           @default(false)
  createdAt       DateTime          @default(now())

  companion       Companion         @relation(fields: [companionId], references: [id], onDelete: Cascade)
  payoutAttempts  Payout[]

  @@index([companionId])
}

model TrustScoreHistoryEntry {
  id             String    @id @default(uuid())
  companionId    String
  oldScore       Int
  newScore       Int
  reason         String
  reasonCategory String?   // Late cancellation, No-show, 5-star review, ban...
  reportId       String?
  incidentId     String?
  date           DateTime  @default(now())

  companion      Companion @relation(fields: [companionId], references: [id], onDelete: Cascade)

  @@index([companionId, date(sort: Desc)])
}
```

---

## 6. Bookings & Sessions

```prisma
// ============================================================
// BOOKINGS
// ============================================================
model Venue {
  id           String   @id @default(uuid())
  googlePlaceId String? @unique
  name         String
  placeType    String   // cafe, restaurant, museum... (FK to PlaceTypeConfig.typeName)
  cityId       String
  address      String
  lat          Float
  lng          Float
  photoUrl     String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  city         City     @relation(fields: [cityId], references: [id])
  bookings     Booking[]

  @@index([cityId])
  @@index([placeType])
}

model Booking {
  id                      String         @id @default(uuid())
  bookingRef              String         @unique // BKG-991
  customerId              String
  companionId             String?        // Nullable if cancelled before accept
  cityId                  String
  activityLabel           String         // "Coffee", "Movie" (denormalized from Interest.name)
  interestId              String?
  venueId                 String?
  venueSnapshot           Json?          // { name, address, lat, lng }
  startTime               DateTime
  endTime                 DateTime
  durationMins            Int
  status                  BookingStatus
  statusChangedAt         DateTime       @default(now())
  customerCancelReasonId  String?
  companionCancelReasonId String?
  adminCancelNote         String?
  bookingAmount           Decimal        @db.Decimal(10,2)
  platformFeePercent      Float          @default(20)
  platformFeeAmount       Decimal        @db.Decimal(10,2)
  companionNetAmount      Decimal        @db.Decimal(10,2)
  paymentStatus           String         // PAID, ESCROW, RELEASED, REFUNDED
  walletTransactionId     String?
  escrowReleaseAt         DateTime?
  extensionCount          Int            @default(0)
  originalBookingId       String?        // If extension, parent booking
  sosTriggered            Boolean        @default(false)
  createdAt               DateTime       @default(now())
  updatedAt               DateTime       @updatedAt

  customer                Customer       @relation("CustomerBookings", fields: [customerId], references: [id])
  companion               Companion?     @relation("CompanionBookings", fields: [companionId], references: [id])
  city                    City           @relation(fields: [cityId], references: [id])
  venue                   Venue?         @relation(fields: [venueId], references: [id])
  disputes               BookingDispute[]
  reports                UserReport[]    @relation("ReportBooking")
  incidents              SafetyIncident[]
  sessionAudit           SessionAuditLog[]
  tickets                SupportTicket[]
  walletTxn              WalletTransaction?

  @@index([customerId, createdAt(sort: Desc)])
  @@index([companionId, createdAt(sort: Desc)])
  @@index([status])
  @@index([startTime(sort: Desc)])
  @@index([cityId, status])
  @@index([bookingRef])
}

model SessionAuditLog {
  id         String     @id @default(uuid())
  bookingId  String
  eventType  String     // BOOKING_CREATED, COMPANION_ACCEPTED, SESSION_START, SOS_TRIGGERED, ENDED...
  actorId    String?
  actorType  String?    // CUSTOMER, COMPANION, ADMIN, SYSTEM
  details    Json?
  timestamp  DateTime   @default(now())

  booking    Booking    @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId, timestamp(sort: Asc)])
}

model BookingDispute {
  id              String         @id @default(uuid())
  bookingId       String         @unique
  disputeReasonId String
  raisedBy        String         // CUSTOMER, COMPANION
  status          RefundStatus   @default(REQUESTED)
  description     String
  evidenceUrls    String[]
  resolutionNote  String?
  refundAmount    Decimal?       @db.Decimal(10,2)
  resolvedAt      DateTime?
  resolvedBy      String?        // staff id
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  booking         Booking        @relation(fields: [bookingId], references: [id])

  @@index([status])
  @@index([createdAt(sort: Desc)])
}
```

---

## 7. Wallets & Financial

```prisma
// ============================================================
// WALLETS + DOUBLE-ENTRY LEDGER (MANDATORY)
// ============================================================
model Wallet {
  id            String              @id @default(uuid())
  ownerType     String              // CUSTOMER or COMPANION
  customerId    String?             @unique
  companionId   String?             @unique
  currency      String              @default("INR")
  balance       Decimal             @default(0) @db.Decimal(14,2)
  ledgerVersion Int                 @default(0) // Optimistic concurrency
  lastTopupAt   DateTime?
  lastSpendAt   DateTime?
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  customer      Customer?           @relation(fields: [customerId], references: [id])
  companion     Companion?          @relation(fields: [companionId], references: [id])
  transactions  WalletTransaction[]

  @@index([ownerType, balance(sort: Desc)])
}

model WalletTransaction {
  id                String                  @id @default(uuid())
  walletId          String
  transactionType   TransactionType
  category          WalletTransactionCategory
  amount            Decimal                 @db.Decimal(14,2)
  balanceAfter      Decimal                 @db.Decimal(14,2)
  description       String
  status            TransactionStatus       @default(SUCCESS)
  bookingId         String?
  payoutId          String?
  invoiceId         String?
  refundId          String?
  gatewayTxnId      String?
  metadata          Json?
  createdAt         DateTime                @default(now())

  wallet            Wallet                  @relation(fields: [walletId], references: [id], onDelete: Restrict)
  booking           Booking?                @relation(fields: [bookingId], references: [id])
  payout            Payout?                 @relation(fields: [payoutId], references: [id])

  @@index([walletId, createdAt(sort: Desc)])
  @@index([bookingId])
  @@index([status, createdAt(sort: Desc)])
  @@index([category])
}

// ============================================================
// PAYOUTS
// ============================================================
model Payout {
  id                 String            @id @default(uuid())
  payoutRef          String            @unique // PO-1001
  companionId        String
  bankAccountId      String?
  amount             Decimal           @db.Decimal(12,2)
  periodStart        Date
  periodEnd          Date
  status             PayoutStatus      @default(PENDING)
  dueDate            Date
  holdReason         String?
  processedAt        DateTime?
  utrNumber          String?           // UTR / transaction reference
  gatewayPayoutId    String?
  failureMessage     String?
  paidByAdminId      String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  companion          Companion         @relation(fields: [companionId], references: [id])
  bankAccount        BankAccount?      @relation(fields: [bankAccountId], references: [id])
  walletTransactions WalletTransaction[] @relation(fields: [payoutId], references: [id])

  @@index([companionId, periodStart(sort: Desc)])
  @@index([status])
  @@index([dueDate])
  @@index([payoutRef])
}

// ============================================================
// REFUNDS
// ============================================================
model Refund {
  id             String              @id @default(uuid())
  bookingId      String
  requestedById  String
  requestedByType String             // CUSTOMER, COMPANION, STAFF
  amount         Decimal             @db.Decimal(10,2)
  status         RefundStatus        @default(REQUESTED)
  reason         String
  approvedById   String?
  processedAt    DateTime?
  gatewayRefundId String?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  walletTxn      WalletTransaction?

  @@index([bookingId])
  @@index([status])
}

// ============================================================
// TAX INVOICES
// ============================================================
model TaxInvoice {
  id            String         @id @default(uuid())
  invoiceNumber String         @unique
  customerId    String?
  companionId   String?
  bookingId     String?
  invoiceDate   DateTime       @default(now())
  status        InvoiceStatus  @default(DRAFT)
  subtotal      Decimal        @db.Decimal(12,2)
  gstPercent    Float          @default(18)
  gstAmount     Decimal        @db.Decimal(12,2)
  totalAmount   Decimal        @db.Decimal(12,2)
  pdfUrl        String?
  billingAddress Json?
  taxNumber     String? // GSTIN
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  walletTxn     WalletTransaction?

  @@index([invoiceNumber])
  @@index([customerId, createdAt(sort: Desc)])
  @@index([status])
}

// ============================================================
// RECONCILIATION
// ============================================================
model ReconciliationRecord {
  id               String                      @id @default(uuid())
  reconciliationDate Date
  gateway          String                      // RAZORPAY, PAYU, STRIPE
  internalTxnId    String?
  internalAmount   Decimal?                    @db.Decimal(12,2)
  internalDate     DateTime?
  gatewayTxnId     String?
  gatewayAmount    Decimal?                    @db.Decimal(12,2)
  gatewayDate      DateTime?
  matchStatus      ReconciliationMatchStatus   @default(PENDING)
  mismatchNote     String?
  createdAt        DateTime                    @default(now())

  @@index([reconciliationDate(sort: Desc)])
  @@index([matchStatus])
  @@index([gateway, gatewayTxnId])
  @@index([internalTxnId])
}

// ============================================================
// FRAUD DETECTION
// ============================================================
model FraudFlag {
  id            String           @id @default(uuid())
  userId        String
  userType      String           // CUSTOMER, COMPANION
  category      String           // PAYMENT, IDENTITY, GROWTH_ABUSE, LOCATION_SPOOFING...
  status        FraudFlagStatus  @default(OPEN)
  description   String
  riskScore     Int              // 0-100
  evidenceJson  Json?
  assignedToId  String?
  actionsTaken  String[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([userId, userType])
  @@index([status])
  @@index([category, createdAt(sort: Desc)])
}
```

---

## 8. Verification & Moderation

```prisma
// ============================================================
// KYC VERIFICATION
// ============================================================
model VerificationCase {
  id                        String                     @id @default(uuid())
  caseRef                   String                     @unique // CASE-4821
  applicantId               String
  applicantType             VerificationApplicantType
  provider                  KYCProvider?
  documentType              String                     // AADHAAR, PAN...
  idDocumentUrl             String                     // S3 presigned
  selfieUrl                 String
  backgroundDeclarationUrl  String?                    // Companion-only
  faceMatchScore            Int?                       // 0-100
  livenessPass              Boolean?
  documentValid             Boolean?
  status                    VerificationStatus         @default(PENDING_MANUAL_REVIEW)
  reviewNotes               String?
  reviewedByStaffId         String?
  autoRunAt                 DateTime?
  decidedAt                 DateTime?
  submittedAt               DateTime                   @default(now())
  auditTrail                VerificationAuditEvent[]

  @@index([applicantId, applicantType])
  @@index([status])
  @@index([submittedAt(sort: Desc)])
  @@index([caseRef])
}

model VerificationAuditEvent {
  id          String           @id @default(uuid())
  caseId      String
  timestamp   DateTime         @default(now())
  action      String           // "Auto-check ran", "Decision: APPROVE", ...
  actor       String           // "System", "Admin Name"
  actorId     String?
  notes       String?

  kycCase     VerificationCase @relation(fields: [caseId], references: [id], onDelete: Cascade)

  @@index([caseId, timestamp(sort: Asc)])
}

model VerificationThreshold {
  id                   String      @id @default("singleton")
  autoApproveThreshold Int         @default(90)
  autoRejectThreshold  Int         @default(30)
  livenessRequired     Boolean     @default(true)
  enabledProvider      KYCProvider @default(HYPERVERGE)
  updatedAt            DateTime    @updatedAt
}

// ============================================================
// COMPANION APPLICATION
// ============================================================
model CompanionApplication {
  id                String   @id @default(uuid())
  companionId       String?  @unique
  firstName         String
  lastName          String
  phone             String
  email             String?
  cityId            String
  cvUrl             String?
  portfolioUrls     String[]
  applicationStatus String   // SUBMITTED, SCREENING, INTERVIEW_SCHEDULED, APPROVED, REJECTED
  reviewNotes       String?
  reviewedByStaffId String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([applicationStatus, createdAt(sort: Desc)])
  @@index([cityId])
}

// ============================================================
// USER REPORTS (Moderation > Reports & Warnings)
// ============================================================
model UserReport {
  id              String        @id @default(uuid())
  reportRef       String        @unique // REP-001
  reporterId      String
  reporterType    String        // CUSTOMER, COMPANION, ADMIN
  reportedUserId  String
  reportedUserType String       // CUSTOMER, COMPANION
  categoryCode    String        // FK to IncidentType.code?
  description     String
  evidenceUrls    String[]
  bookingId       String?
  status          ReportStatus  @default(OPEN)
  assignedToId    String?
  assignedTo      StaffEmployee? @relation("ReportAssignee", fields: [assignedToId], references: [id])
  notes           Json?         // { timestamp, note, author }[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  reporter        Customer?     @relation("ReportReporter", fields: [reporterId], references: [id])
  booking         Booking?      @relation("ReportBooking", fields: [bookingId], references: [id])

  @@index([status])
  @@index([assignedToId])
  @@index([createdAt(sort: Desc)])
  @@index([reportRef])
  @@index([reportedUserId, reportedUserType])
}

// ============================================================
// BANS
// ============================================================
model UserBan {
  id             String       @id @default(uuid())
  userId         String
  userType       String       // CUSTOMER, COMPANION
  reason         String
  reportId       String?
  duration       BanDuration
  startsAt       DateTime     @default(now())
  endsAt         DateTime?    // Null if PERMANENT
  bannedById     String
  liftedAt       DateTime?
  liftedById     String?
  liftReason     String?
  createdAt      DateTime     @default(now())

  @@index([userId, userType])
  @@index([startsAt(sort: Desc)])
}

// ============================================================
// REVIEWS
// ============================================================
model Review {
  id                   String                 @id @default(uuid())
  bookingId            String
  byCustomerId         String
  toCompanionId        String?
  byCompanionId        String?
  toCustomerId         String?
  rating               Int                    // 1-5
  text                 String?
  tagCodes             String[]               // FK to ReviewTagOption.code
  moderationStatus     ReviewModerationStatus @default(PENDING)
  moderationNote       String?
  moderatedById        String?
  createdAt            DateTime               @default(now())

  byCustomer           Customer               @relation("ReviewByCustomer", fields: [byCustomerId], references: [id])
  toCompanion          Companion?             @relation("ReviewCompanionReceived", fields: [toCompanionId], references: [id])
  byCompanion          Companion?             @relation("ReviewByCompanion", fields: [byCompanionId], references: [id])
  toCustomer           Customer?              @relation("ReviewCustomerReceived", fields: [toCustomerId], references: [id])

  @@unique([bookingId, byCustomerId, toCompanionId])
  @@unique([bookingId, byCompanionId, toCustomerId])
  @@index([byCustomerId])
  @@index([toCompanionId])
  @@index([moderationStatus])
  @@index([createdAt(sort: Desc)])
}

// ============================================================
// APPEALS
// ============================================================
model UserBanAppeal {
  id             String       @id @default(uuid())
  banId          String
  appealReason   String
  status         AppealStatus @default(OPEN)
  reviewerId     String?
  reviewNote     String?
  createdAt      DateTime     @default(now())
  reviewedAt     DateTime?

  @@index([banId])
  @@index([status])
}
```

---

## 9. Safety Operations

```prisma
// ============================================================
// SOS ALERTS
// ============================================================
model SOSAlert {
  id              String     @id @default(uuid())
  alertRef        String     @unique
  userId          String
  userType        String
  bookingId       String?
  lat             Float
  lng             Float
  status          SOSStatus  @default(TRIGGERED)
  audioClipUrl    String?    // S3
  acknowledgedById String?
  acknowledgedAt  DateTime?
  resolvedNote    String?
  resolvedById    String?
  resolvedAt      DateTime?
  authoritiesContacted Boolean @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  booking         Booking?   @relation(fields: [bookingId], references: [id])

  @@index([status, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@index([bookingId])
  @@index([alertRef])
}

// ============================================================
// SAFETY INCIDENTS
// ============================================================
model SafetyIncident {
  id                    String          @id @default(uuid())
  incidentRef           String          @unique // INC-001
  incidentTypeCode      String          // FK IncidentType.code
  involvedCustomerIds   String[]
  involvedCompanionIds  String[]
  status                IncidentStatus  @default(OPEN)
  legalEscalation       Boolean         @default(false)
  description           String
  evidenceUrls          String[]
  preserveEvidence      Boolean         @default(false)
  assignedInvestigatorId String?
  investigatorNotes     Json?           // { timestamp, note, author }[]
  bookingId             String?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  investigator          StaffEmployee?  @relation("IncidentInvestigator", fields: [assignedInvestigatorId], references: [id])
  booking               Booking?        @relation(fields: [bookingId], references: [id])

  @@index([status])
  @@index([incidentTypeCode])
  @@index([legalEscalation])
  @@index([createdAt(sort: Desc)])
  @@index([incidentRef])
}

// ============================================================
// GEOFENCE
// ============================================================
model GeofenceZone {
  id              String   @id @default(uuid())
  zoneName        String
  cityId          String
  zoneType        String   // RESTRICTED, SERVICE_BOUNDARY, HIGH_RISK
  boundaryGeoJson Json     // GeoJSON Polygon or Circle (lat,lng,radius)
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())

  @@index([cityId, zoneType])
}

model GeofenceAlertEvent {
  id         String               @id @default(uuid())
  zoneId     String
  bookingId  String?
  userId     String
  userType   String
  alertType  GeofenceAlertType
  lat        Float
  lng        Float
  seen       Boolean              @default(false)
  createdAt  DateTime             @default(now())

  @@index([seen, createdAt(sort: Desc)])
  @@index([zoneId, createdAt(sort: Desc)])
}

// ============================================================
// EMERGENCY WORKFLOW CONFIG
// ============================================================
model EmergencyWorkflowConfig {
  id                 String   @id @default("singleton")
  acknowledgementSlaSeconds  Int @default(30)
  escalationSlaSeconds       Int @default(300)
  authoritiesContactIfNoResolveSeconds Int @default(600)
  onCallTeamIds      String[] // staff ids
  updatedAt          DateTime @updatedAt
}

// ============================================================
// AGE / MINOR ESCALATION
// ============================================================
model MinorAgeEscalation {
  id           String   @id @default(uuid())
  userId       String
  userType     String
  reportedById String
  evidenceUrls String[]
  status       String   // OPEN, VERIFIED_MINOR, VERIFIED_ADULT, CLOSED
  reviewNote   String?
  reviewedById String?
  createdAt    DateTime @default(now())

  @@index([status])
}
```

---

## 10. Support & Notifications

```prisma
// ============================================================
// SUPPORT TICKETS
// ============================================================
model SupportTicket {
  id                String                @id @default(uuid())
  ticketRef         String                @unique // TKT-10293
  userId            String
  userName          String                // denorm
  userType          String                // CUSTOMER, COMPANION
  categoryCode      String                // FK TicketCategory.code
  priority          SupportTicketPriority @default(MEDIUM)
  status            SupportTicketStatus   @default(OPEN)
  subject           String
  escalationLevel   TicketEscalationLevel @default(L1)
  assignedToId      String?
  slaDeadline       DateTime?
  resolutionNote    String?
  relatedBookingId  String?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  customer          Customer?             @relation("CustomerTickets", fields: [userId], references: [id])
  assignedTo        StaffEmployee?        @relation("TicketAssignee", fields: [assignedToId], references: [id])
  messages          TicketMessage[]
  audit             TicketAuditEvent[]

  @@index([status])
  @@index([assignedToId, status])
  @@index([escalationLevel])
  @@index([slaDeadline])
  @@index([userType, userId])
  @@index([categoryCode])
  @@index([ticketRef])
}

model TicketMessage {
  id         String        @id @default(uuid())
  ticketId   String
  senderId   String
  senderType String        // USER, SUPPORT, SYSTEM
  message    String
  attachmentUrls String[]
  createdAt  DateTime      @default(now())

  ticket     SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId, createdAt(sort: Asc)])
}

model TicketAuditEvent {
  id         String        @id @default(uuid())
  ticketId   String
  event      String        // STATUS_CHANGED, ASSIGNED, ESCALATED, PRIORITY_CHANGED
  actorId    String?
  oldValue   Json?
  newValue   Json?
  timestamp  DateTime      @default(now())

  ticket     SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId, timestamp(sort: Asc)])
}

// ============================================================
// NOTIFICATIONS (STAFF + END USERS)
// ============================================================
model NotificationTemplate {
  id            String                 @id @default(uuid())
  templateKey   String                 @unique // BOOKING_CREATED, PAYOUT_SENT, SOS_ACKNOWLEDGED
  category      NotificationCategory
  subject       Json                   // { en, hi }
  body          Json                   // { en, hi } - handlebars placeholders
  channels      NotificationChannel[]  // Which channels to send on
  active        Boolean                @default(true)
}

model NotificationDispatch {
  id             String              @id @default(uuid())
  templateKey    String
  recipientId    String
  recipientType  String              // STAFF, CUSTOMER, COMPANION
  channel        NotificationChannel
  status         String              // PENDING, SENT, FAILED
  payload        Json                // The hydrated values from template placeholders
  sentAt         DateTime?
  failureReason  String?
  createdAt      DateTime            @default(now())

  @@index([recipientId, recipientType])
  @@index([createdAt(sort: Desc)])
  @@index([status])
}

// ============================================================
// STAFF NOTIFICATIONS (in-app inbox)
// ============================================================
model StaffNotification {
  id           String   @id @default(uuid())
  staffId      String
  title        String
  body         String
  type         String   // SOS_ALERT, TICKET_ASSIGNED, REPORT_ESCALATED, BREACH_SLA
  read         Boolean  @default(false)
  relatedId    String?
  relatedType  String?
  createdAt    DateTime @default(now())

  @@index([staffId, read, createdAt(sort: Desc)])
}
```

---

## 11. Discovery / Platform Config

```prisma
// ============================================================
// DISCOVERY RANKING CONFIG
// ============================================================
model DiscoveryRankingConfig {
  id                      String  @id @default("singleton")
  // Weight multipliers
  trustScoreWeight        Float   @default(0.35)
  ratingWeight            Float   @default(0.25)
  responseTimeWeight      Float   @default(0.15)
  acceptRateWeight        Float   @default(0.10)
  sessionCompletionWeight Float   @default(0.10)
  proximityBonusWeight    Float   @default(0.05)
  // Rules
  minTrustScoreForTopPool Int     @default(80)
  minAcceptanceRatePercent Int    @default(70)
  newCompanionBoostPercent Float  @default(20)
  updatedAt               DateTime @updatedAt
}

// ============================================================
// MATCHMAKING CONFIG (per city)
// ============================================================
model MatchmakingConfig {
  id                      String   @id @default(uuid())
  cityId                  String   @unique
  searchRadiusKm          Float    @default(25)
  maxCompanionSuggestions Int      @default(10)
  companionAcceptDeadlineMins Int  @default(15)
  autoRetryCount          Int      @default(2)
  updatedAt               DateTime @updatedAt
}

// ============================================================
// SPECIAL EVENTS
// ============================================================
model SpecialEvent {
  id           String   @id @default(uuid())
  cityId       String
  title        Json
  description  Json
  bannerUrl    String
  startDate    DateTime
  endDate      DateTime
  discountPct  Float?
  featured     Boolean  @default(false)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  @@index([cityId, active])
}

// ============================================================
// POLICY DOCS
// ============================================================
model PolicyDocument {
  id           String   @id @default(uuid())
  docKey       String   @unique // TERMS_OF_SERVICE, PRIVACY_POLICY, SAFETY_POLICY
  title        String
  content      String   // Markdown or HTML
  version      String   // "2.1.0"
  effectiveOn  DateTime
  publishedBy  String?
  createdAt    DateTime @default(now())

  @@index([docKey, effectiveOn(sort: Desc)])
}

// ============================================================
// TRAINING CONTENT (for staff + companions)
// ============================================================
model TrainingModule {
  id             String   @id @default(uuid())
  title          String
  audience       String   // STAFF, COMPANION, BOTH
  requiredRole   StaffRole?
  contentUrl     String
  quizJson       Json?
  passPctReq     Int      @default(80)
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
}

// ============================================================
// DATA PRIVACY REQUESTS (DSAR)
// ============================================================
model DataPrivacyRequest {
  id               String   @id @default(uuid())
  requestRef       String   @unique
  userId           String
  userType         String
  requestType      String   // ACCESS, ERASURE (RTBF), DATA_EXPORT, CORRECTION
  status           String   // RECEIVED, IN_PROGRESS, COMPLETED, REJECTED
  statusDetails    String?
  requestedFields  String[]
  fulfillmentUrl   String?  // S3 presigned - export zip
  completedAt      DateTime?
  createdAt        DateTime @default(now())

  @@index([status])
  @@index([requestType])
  @@index([userId, userType])
}

// ============================================================
// LEGAL REQUESTS
// ============================================================
model LegalRequest {
  id                 String   @id @default(uuid())
  requestRef         String   @unique
  authority          String   // Court / Police
  caseReference      String
  requestType        String   // USER_DATA, CHAT_HISTORY, KYC_DOCS, SESSION_LOGS
  targetUserId       String
  preserveUntil      DateTime
  fulfillmentStatus  String   // PENDING, IN_PROGRESS, COMPLETED, APPEALED
  documentsUrl       String?  // S3
  approvedByLegalId  String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([fulfillmentStatus])
  @@index([preserveUntil])
}
```

---

## 12. System Config + Misc

```prisma
// ============================================================
// DYNAMIC APP CONFIGS
// ============================================================
model AppConfig {
  id          String   @id @default(uuid())
  configKey   String   @unique // "MIN_APP_VERSION_ANDROID", "FEATURE_SOS_ENABLED"
  value       Json     // { "android": "2.3.0", "ios": "2.3.0" }
  description String?
  updatedAt   DateTime @updatedAt
}

// ============================================================
// REFERRAL PROGRAM
// ============================================================
model ReferralCode {
  id              String   @id @default(uuid())
  code            String   @unique
  ownerId         String
  ownerType       String   // CUSTOMER, COMPANION
  signupBonus     Decimal  @db.Decimal(10,2)
  refereeBonus    Decimal  @db.Decimal(10,2)
  maxUsages       Int?
  usagesCount     Int      @default(0)
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
}

// ============================================================
// MARKETING ANNOUNCEMENTS (Notifcations Module)
// ============================================================
model Announcement {
  id          String   @id @default(uuid())
  title       Json
  body        Json
  targetAudience String // ALL, CUSTOMERS_ONLY, COMPANIONS_ONLY, CITY_SCOPE
  targetCityIds  String[]
  publishedAt DateTime
  expiresAt   DateTime?
  createdById String
  createdAt   DateTime @default(now())
}
```

---

## 13. Database Index Strategy Summary

Index every field you filter or sort on:

### Critical Performance Indexes
1. **All `createdAt` DESC** — every list page sorts newest-first
2. **All `status` + `createdAt` DESC** — the most common filter
3. **Foreign keys** (Prisma auto-creates, but verify)
4. **Unique indexes** on: `email`, `phone`, `employeeId`, `caseRef`, `ticketRef`, `payoutRef`, `bookingRef`

### PostgreSQL Extensions
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- Encryption utilities
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- uuid generation
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Fuzzy search (for search queries on name/email)
```

### Row-Level Security (Optional — Enterprise)
For CITY_OPS_MANAGER, create PostgreSQL RLS policies so a `city_scope = 'CITY-1'` staff literally cannot see rows from other cities at database level (not just app level).

---

## 14. Database initialization

The current prisma/seed.ts only upserts the English application language. It never inserts demo accounts or operational activity. Create the first administrator with the separate admin:bootstrap command and explicit credentials; existing administrators are preserved. Manage cities, areas, languages and other reference settings through their APIs or administration screens.

Historical demo records require a reviewed cleanup with a database backup. See ../../docs/VERIFY_BACKEND_INTEGRATION.md for local verification and cleanup details.

---

## 15. Next Document

Continue to **[03-API-ENDPOINTS.md](./03-API-ENDPOINTS.md)** for the complete HTTP route list (method, path, auth, required roles, request/response DTOs).
