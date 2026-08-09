# New Home Warranty HQ — Architecture Plan

This document is the source-of-truth technical plan for the approved product scope. It does not change business model, pricing, or UX decisions from the master specification.

> **Corrections applied**: The approved 10 technical corrections from the review are implemented in the repository code and in the validated Prisma schema at `prisma/schema.prisma`. The schema block below is retained for reference but should not be treated as the live source of truth for the database.

---

## 1. Final Recommended Tech Stack & Reasoning

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Framework | **Next.js 16 Active LTS (App Router)** | Server components for marketing pages, API routes in one codebase, excellent Vercel support, strong TypeScript. |
| Language | **TypeScript 5** | Type safety across full stack; required for maintainability at this scope. |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid, consistent UI with accessible primitives. shadcn/ui gives unstyled, copy-paste components we can brand. |
| Database | **PostgreSQL on Neon** | Managed Postgres with branching, PITR, good free tier, serverless connection pooling. |
| ORM | **Prisma** | Mature relational modeling, migrations, type-safe queries, works well on Vercel. |
| Auth | **Better Auth + `better-auth/adapters/prisma`** | Database-backed sessions, email/password, email verification, password reset, and secure session revocation. |
| Payments | **Stripe Checkout + Stripe Webhooks** | One-time payments, receipt emails, refunds, webhook idempotency all handled. |
| Object Storage | **Cloudflare R2** (S3-compatible) | No egress fees, signed URLs, private buckets, lower cost than S3 for file previews and exports. |
| Email | **Resend + React Email** | Reliable transactional email, clean React-based templates, good free tier. |
| Optional SMS | **Twilio** | Only enabled if compliance infra (opt-in, STOP/HELP) is ready. |
| Caching / Rate limits | **Upstash Redis** | Rate limiting, cron locks, optional session caching. |
| Cron / Jobs | **Vercel Cron** for hourly reminders; **Inngest** or **QStash** if we outgrow it. | Serverless-native; easy to upgrade. |
| Analytics | **Plausible** (public site) + in-house `AnalyticsEvent` table (product) | Privacy-conscious, no PII leakage, full event funnel tracking. |
| Error / Perf | **Sentry + Vercel Analytics** | Error tracking and Core Web Vitals. |
| Deployment | **Vercel** | Edge + Node runtime, previews, Cron, secrets management, fast global CDN. |
| PDF | **@react-pdf/renderer** | Pure-Node PDF generation; no Chrome binary required, works on Vercel. |
| Testing | **Vitest + React Testing Library + Playwright** | Unit, component, and E2E coverage for critical flows. |

### Why not a different stack
- No separate mobile apps (per launch exclusions).
- No microservices; a clean monolith is preferred.
- Avoid heavy server-side Chrome for PDFs (Puppeteer) to keep functions fast and cold-start low.
- Avoid over-provisioning: R2 + Neon free/entry tiers keep costs minimal pre-launch.

---

## 2. Full Database Schema (Prisma)

> The **validated, corrected schema** is in `prisma/schema.prisma` in this repository. The block below is the original plan and should be compared against the live file.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums ----------

enum UserRole {
  HOMEOWNER
  PARTNER
  ADMIN
}

enum UserStatus {
  ACTIVE
  DISABLED
  PENDING
}

enum AdminPermission {
  VIEW_USERS
  VIEW_HOMES
  VIEW_PURCHASES
  VIEW_GIFTS
  PROCESS_REFUNDS
  DISABLE_ACCOUNTS
  RESEND_GIFTS
  VIEW_ISSUES
  VIEW_DOCUMENTS
  MANAGE_PARTNERS
  MANAGE_SETTINGS
}

enum ProductType {
  HOMEOWNER
  GIFT
}

enum PurchaseStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum HomeMembershipRole {
  PRIMARY
  COOWNER
}

enum HomeEntitlementStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

enum PartnerType {
  REALTOR
  LENDER
  TITLE
  INSPECTOR
  OTHER
}

enum DocumentType {
  BUILDER_WARRANTY
  HOMEOWNER_MANUAL
  PURCHASE_AGREEMENT
  ADDENDUM
  WORKMANSHIP_STANDARDS
  INSPECTION_REPORT
  PUNCH_LIST
  THIRD_PARTY_WARRANTY
  BUILDER_INSTRUCTIONS
  ISSUE_PHOTO
  ISSUE_ATTACHMENT
  SUBMISSION_CONFIRMATION
  REPAIR_PHOTO
  FINAL_REPORT
  REQUEST_LETTER
  OTHER
}

enum IssueStatus {
  OPEN
  SUBMITTED
  SCHEDULED
  RESOLVED
}

enum IssueCategory {
  EXTERIOR
  ROOF
  SIDING
  WINDOWS
  DOORS
  CONCRETE
  FOUNDATION
  DRAINAGE
  GARAGE
  KITCHEN
  BATHROOM
  PLUMBING
  HVAC
  ELECTRICAL
  FLOORING
  CABINETS
  COUNTERTOPS
  WALLS_CEILING
  BASEMENT
  OTHER
}

enum WarrantyRequestType {
  ISSUE
  WARRANTY_DOCUMENT
}

enum WarrantyRequestStatus {
  DRAFT
  APPROVED
  SENT
}

enum SubmissionMethod {
  EMAIL
  PORTAL
  PDF
  MAIL
  OTHER
}

enum RepairVerificationStatus {
  FULLY_RESOLVED
  PARTIALLY_RESOLVED
  NOT_RESOLVED
  ISSUE_RETURNED
  NEW_DAMAGE
  NEED_MORE_TIME
}

enum ReminderType {
  SUBMISSION_PENDING
  BUILDER_RESPONSE_PENDING
  APPOINTMENT_UPCOMING
  REPAIR_COMPLETED_VERIFY
  UNRESOLVED_ISSUES
  WARRANTY_REVIEW_UPCOMING
  DOCUMENT_MISSING
  FINAL_REVIEW
}

enum ReminderChannel {
  EMAIL
  SMS
}

enum ReminderStatus {
  PENDING
  SENT
  DISMISSED
  ACTIONED
}

// ---------- Auth ----------

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())
}

// ---------- Users & Homes ----------

model User {
  id                    String             @id @default(uuid())
  email                 String             @unique
  emailVerified         DateTime?
  passwordHash          String?
  role                  UserRole           @default(HOMEOWNER)
  status                UserStatus         @default(ACTIVE)
  name                  String?
  phone                 String?
  smsOptIn              Boolean            @default(false)
  smsConsentAt          DateTime?
  onboardingCompletedAt DateTime?
  permissions           AdminPermission[]
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Auth.js relations
  accounts              Account[]
  sessions              Session[]
  passwordResetTokens   PasswordResetToken[]

  // App relations
  ownedHomes            Home[]             @relation("PrimaryOwner")
  homeMemberships       HomeMembership[]
  partnerProfile        PartnerProfile?
  purchases             Purchase[]
  sentGifts             GiftPurchase[]     @relation("SentGifts")
  redeemedGifts         GiftPurchase[]     @relation("RedeemedBy")
  entitlements          HomeEntitlement[]
  issues                Issue[]
  documents             Document[]
  reminders             Reminder[]
  reminderSetting       ReminderSetting?
  supportNotes          SupportNote[]
  auditLogs             AuditLog[]
  analyticsEvents       AnalyticsEvent[]
}

model Home {
  id                      String              @id @default(uuid())
  address                 String
  closingDate             DateTime
  occupancyDate           DateTime?
  builderName             String
  builderContactName      String?
  builderEmail            String?
  builderPhone            String?
  builderWarrantyPortalUrl String?
  thirdPartyWarrantyCompany String?
  state                   String?
  propertyCharacteristics Json?
  primaryOwnerId          String
  primaryOwner            User                @relation("PrimaryOwner", fields: [primaryOwnerId], references: [id])
  partnerGiftId           String?             @unique
  partnerGift             GiftPurchase?       @relation("GiftHome", fields: [partnerGiftId], references: [id])
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt

  memberships             HomeMembership[]
  documents               Document[]
  issues                  Issue[]
  entitlements            HomeEntitlement[]
  reminders               Reminder[]
  finalReviews            FinalReview[]
  exports                 ExportJob[]
}

model HomeMembership {
  id     String             @id @default(uuid())
  homeId String
  userId String
  role   HomeMembershipRole @default(COOWNER)
  home   Home               @relation(fields: [homeId], references: [id], onDelete: Cascade)
  user   User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([homeId, userId])
}

model HomeInvitation {
  id        String             @id @default(uuid())
  homeId    String
  email     String
  token     String             @unique
  role      HomeMembershipRole @default(COOWNER)
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime           @default(now())

  home      Home               @relation(fields: [homeId], references: [id], onDelete: Cascade)
}

// ---------- Purchases & Entitlements ----------

model Purchase {
  id                      String             @id @default(uuid())
  userId                  String?
  user                    User?              @relation(fields: [userId], references: [id])
  productType             ProductType
  amount                  Int // cents
  currency                String             @default("usd")
  stripePaymentIntentId   String?            @unique
  stripeCheckoutSessionId String?            @unique
  stripeCustomerId        String?
  status                  PurchaseStatus     @default(PENDING)
  refundedAt              DateTime?
  refundAmount            Int?
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt

  giftPurchase            GiftPurchase?
  entitlement             HomeEntitlement?
  onboardingToken         OnboardingToken?
}

model GiftPurchase {
  id              String      @id @default(uuid())
  partnerId       String
  partner         User        @relation("SentGifts", fields: [partnerId], references: [id])
  purchaseId      String      @unique
  purchase        Purchase    @relation(fields: [purchaseId], references: [id])
  recipientName   String
  recipientEmail  String
  propertyAddress String?
  giftMessage     String?
  redemptionToken String    @unique
  redeemedAt      DateTime?
  redeemedByUserId String?
  redeemedBy      User?       @relation("RedeemedBy", fields: [redeemedByUserId], references: [id])
  homeId          String?     @unique
  home            Home?       @relation("GiftHome", fields: [homeId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model OnboardingToken {
  id             String        @id @default(uuid())
  token          String        @unique
  email          String
  purchaseId     String?       @unique
  purchase       Purchase?     @relation(fields: [purchaseId], references: [id])
  giftPurchaseId String?       @unique
  giftPurchase   GiftPurchase? @relation(fields: [giftPurchaseId], references: [id])
  usedAt         DateTime?
  expiresAt      DateTime
  createdAt      DateTime      @default(now())
}

model HomeEntitlement {
  id          String                @id @default(uuid())
  userId      String
  user        User                  @relation(fields: [userId], references: [id])
  homeId      String
  home        Home                  @relation(fields: [homeId], references: [id])
  purchaseId  String                @unique
  purchase    Purchase              @relation(fields: [purchaseId], references: [id])
  status      HomeEntitlementStatus @default(ACTIVE)
  expiresAt   DateTime?
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  @@unique([userId, homeId, purchaseId])
}

// ---------- Partner ----------

model PartnerProfile {
  id        String      @id @default(uuid())
  userId    String      @unique
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  partnerType PartnerType
  company   String?
  photoUrl  String?
  logoUrl   String?
  phone     String?
  slug      String      @unique
  isApproved Boolean    @default(false)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

// ---------- Documents ----------

model Document {
  id        String     @id @default(uuid())
  homeId    String
  home      Home       @relation(fields: [homeId], references: [id], onDelete: Cascade)
  issueId   String?
  issue     Issue?     @relation(fields: [issueId], references: [id], onDelete: SetNull)
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  type      DocumentType
  label     String
  fileKey   String     @unique
  fileSize  Int?
  mimeType  String?
  status    String     @default("ACTIVE")
  uploadedAt DateTime  @default(now())
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

// ---------- Issues & Requests ----------

model Issue {
  id                    String             @id @default(uuid())
  homeId                String
  home                  Home               @relation(fields: [homeId], references: [id], onDelete: Cascade)
  userId                String
  user                  User               @relation(fields: [userId], references: [id])
  title                 String
  location              String?
  category              IssueCategory      @default(OTHER)
  dateNoticed           DateTime?
  description           String?
  isRecurring           Boolean            @default(false)
  isWorsening           Boolean            @default(false)
  previousCommunication String?
  previousRepairAttempt String?
  status                IssueStatus        @default(OPEN)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  resolvedAt            DateTime?
  resolutionNotes       String?

  documents             Document[]
  warrantyRequests      WarrantyRequest[]
  submissionRecords     SubmissionRecord[]
  appointments          Appointment[]
  repairVerifications   RepairVerification[]
  statusHistory         IssueStatusHistory[]
  reminders             Reminder[]
}

model IssueStatusHistory {
  id        String      @id @default(uuid())
  issueId   String
  issue     Issue       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  status    IssueStatus
  changedBy String
  note      String?
  createdAt DateTime    @default(now())
}

model WarrantyRequest {
  id              String                @id @default(uuid())
  issueId         String?
  issue           Issue?                @relation(fields: [issueId], references: [id], onDelete: Cascade)
  homeId          String
  home            Home                  @relation(fields: [homeId], references: [id])
  type            WarrantyRequestType   @default(ISSUE)
  generatedContent String               @db.Text
  requestedNextStep String?
  status          WarrantyRequestStatus @default(DRAFT)
  approvedAt      DateTime?
  sentAt          DateTime?
  generatedAt     DateTime              @default(now())
  createdBy       String
  user            User                  @relation(fields: [createdBy], references: [id])

  submissionRecords SubmissionRecord[]
}

model SubmissionRecord {
  id                             String           @id @default(uuid())
  issueId                        String
  issue                          Issue            @relation(fields: [issueId], references: [id], onDelete: Cascade)
  warrantyRequestId              String?
  warrantyRequest                WarrantyRequest? @relation(fields: [warrantyRequestId], references: [id])
  method                         SubmissionMethod
  destination                    String?
  message                        String           @db.Text
  attachmentDocumentIds          String[]
  confirmationNumber             String?
  confirmationScreenshotDocumentId String?
  submittedAt                    DateTime         @default(now())
  submittedBy                    String
  user                           User             @relation(fields: [submittedBy], references: [id])
}

model Appointment {
  id                  String    @id @default(uuid())
  issueId             String
  issue               Issue     @relation(fields: [issueId], references: [id], onDelete: Cascade)
  appointmentDate     DateTime?
  builderRepresentative String?
  trade               String?
  expectedRepairDate  DateTime?
  promisedActions     String?
  partsOrdered        String?
  notes               String?
  missed              Boolean   @default(false)
  completionDate      DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model RepairVerification {
  id              String                   @id @default(uuid())
  issueId         String
  issue           Issue                    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  status          RepairVerificationStatus
  notes           String?
  photoDocumentIds String[]
  verifiedAt      DateTime?
  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt
}

// ---------- Reminders & Calendar ----------

model Reminder {
  id        String          @id @default(uuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  homeId    String?
  home      Home?           @relation(fields: [homeId], references: [id])
  issueId   String?
  issue     Issue?          @relation(fields: [issueId], references: [id])
  type      ReminderType
  dueDate   DateTime
  channel   ReminderChannel @default(EMAIL)
  status    ReminderStatus  @default(PENDING)
  sentAt    DateTime?
  metadata  Json?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

model ReminderSetting {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  emailEnabled      Boolean  @default(true)
  smsEnabled        Boolean  @default(false)
  digestEnabled     Boolean  @default(true)
  quietHoursStart   Int?
  quietHoursEnd     Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ---------- Final Review & Export ----------

model FinalReview {
  id                        String    @id @default(uuid())
  homeId                    String
  home                      Home      @relation(fields: [homeId], references: [id], onDelete: Cascade)
  startedAt                 DateTime  @default(now())
  completedAt               DateTime?
  findings                  Json?
  consolidatedReportDocumentId String?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
}

model ExportJob {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  homeId      String
  home        Home      @relation(fields: [homeId], references: [id])
  format      String    // PDF or ZIP
  status      String    // PENDING, PROCESSING, READY, FAILED
  fileKey     String?
  fileSize    Int?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
  completedAt DateTime?
}

// ---------- Admin & Audit ----------

model SupportNote {
  id        String   @id @default(uuid())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  userId    String?
  homeId    String?
  issueId   String?
  note      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id])
  action    String
  entityType String
  entityId  String?
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
}

// ---------- Analytics ----------

model AnalyticsEvent {
  id           String    @id @default(uuid())
  userId       String?
  user         User?     @relation(fields: [userId], references: [id])
  anonymousId  String?
  event        String
  properties   Json?
  sessionId    String?
  createdAt    DateTime  @default(now())

  @@index([event, createdAt])
  @@index([userId])
  @@index([anonymousId])
}

model PartnerRecommendationVisit {
  id            String    @id @default(uuid())
  partnerId     String
  partner       User      @relation(fields: [partnerId], references: [id])
  ipHash        String?
  userAgent     String?
  convertedUserId String?
  convertedAt   DateTime?
  createdAt     DateTime  @default(now())
}
```

### Key schema decisions
- `Home` uses `primaryOwnerId` as the source-of-truth primary owner; `HomeMembership` is for co-owners only.
- Authorization helpers recognize both `Home.primaryOwnerId` and `HomeMembership`.
- `Purchase` is created as `PENDING` before Stripe and marked `SUCCEEDED` by webhook. `OnboardingToken` links the purchase to account creation. `Home` + `HomeEntitlement` are created only during onboarding after the home is supplied.
- `GiftPurchase` follows the same pattern: `PENDING` record before checkout, `SUCCEEDED` on webhook, redeemed later.
- `WarrantyRequest` can be issue-specific (`type = ISSUE`) or a missing-doc request (`type = WARRANTY_DOCUMENT`).
- `Document` is the single source for all files, referenced by `fileKey` (R2/S3 key).
- Submission attachments and repair photos are relational (`SubmissionAttachment`, `RepairVerificationPhoto`), not plain arrays.
- `ConnectedEmailAccount` supports homeowner-origin builder email via Gmail or Microsoft/Outlook OAuth.
- `Submission` captures method, destination, confirmation, and attachments with proof-of-submission records.
- `Reminder` table drives the email/SMS reminder engine; hourly delivery uses a `CRON_SECRET`-guarded Vercel Cron and an idempotency key.
- `AuditLog` captures admin and sensitive actions.
- Admin permissions are granular: `VIEW_HOMES` does **not** grant `VIEW_ISSUES` or `VIEW_DOCUMENTS`.

---

## 3. User Roles & Authorization Matrix

### Roles

| Role | Description |
|------|-------------|
| `ANONYMOUS` | Public visitor. Can view marketing, purchase, redeem gift, log in. |
| `HOMEOWNER_PRIMARY` | Owns the home. Full control over home, issues, documents, exports, deletions. |
| `HOMEOWNER_COOWNER` | Invited member. Can view, add issues, upload photos, add notes. Cannot delete home or change billing. |
| `PARTNER` | Gift sender/recommender. Owns partner profile. Can view gift status, not homeowner issues. |
| `ADMIN` | Internal staff. Base admin dashboard access. Sensitive views require explicit permission. |
| `SUPERADMIN` | Admin with all `AdminPermission` values. Can manage settings, refunds, disable accounts. |

### Permission check logic

All server actions and API routes use a helper:

```ts
async function requireHomeAccess(session: Session, homeId: string, minRole?: HomeMembershipRole)
```

- If `session.role === ADMIN` and has `VIEW_HOMES` permission, allow.
- Else look up `HomeMembership` for `session.userId` + `homeId`.
- If `minRole === PRIMARY`, require `role === PRIMARY`.

```ts
async function requireIssueAccess(session: Session, issueId: string)
```

- Load issue, call `requireHomeAccess` with issue's `homeId`.
- Admin with `VIEW_ISSUES` can view but should not mutate unless permission added.

```ts
async function requirePartnerOwnsGift(session: Session, giftId: string)
```

- `session.role === PARTNER` and `GiftPurchase.partnerId === session.userId`.

```ts
async function requireAdminPermission(session: Session, permission: AdminPermission)
```

- `session.role === ADMIN` and `session.permissions.includes(permission)`.

### Authorization Matrix

| Action | Anonymous | Co-owner | Primary | Partner | Admin (perm) | Superadmin |
|---|---|---|---|---|---|---|
| View public pages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buy homeowner ($189) | ✅ | - | - | - | - | - |
| Redeem gift | ✅ via token | - | - | - | - | - |
| View own dashboard | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add / edit home (own) | - | - | ✅ | - | `VIEW_HOMES` | ✅ |
| Delete home | - | - | ✅ | - | `MANAGE_SETTINGS` | ✅ |
| Invite co-owner | - | - | ✅ | - | - | - |
| View issues of a home | - | ✅ | ✅ | ❌ never | `VIEW_ISSUES` | ✅ |
| Create issue in home | - | ✅ | ✅ | ❌ never | - | - |
| Generate request for issue | - | ✅ | ✅ | ❌ never | - | - |
| Submit request to builder | - | ✅ | ✅ | ❌ never | - | - |
| View documents of home | - | ✅ | ✅ | ❌ never | `VIEW_DOCUMENTS` | ✅ |
| Upload document | - | ✅ | ✅ | ❌ never | - | - |
| Track appointments | - | ✅ | ✅ | ❌ never | `VIEW_ISSUES` | ✅ |
| Verify repair | - | ✅ | ✅ | ❌ never | - | - |
| Export full record | - | - | ✅ | ❌ never | `VIEW_DOCUMENTS` | ✅ |
| View partner dashboard | - | - | - | ✅ | `MANAGE_PARTNERS` | ✅ |
| Send gift ($124) | - | - | - | ✅ | - | - |
| View gift status (own) | - | - | - | ✅ | `VIEW_GIFTS` | ✅ |
| View admin dashboard | - | - | - | - | `VIEW_USERS` | ✅ |
| Search users / homes | - | - | - | - | `VIEW_USERS` / `VIEW_HOMES` | ✅ |
| Process refund | - | - | - | - | `PROCESS_REFUNDS` | ✅ |
| Disable account | - | - | - | - | `DISABLE_ACCOUNTS` | ✅ |
| Resend gift invitation | - | - | - | - | `RESEND_GIFTS` | ✅ |
| View audit logs / analytics | - | - | - | - | `MANAGE_SETTINGS` | ✅ |

---

## 4. Complete Route / Page Map

### Public marketing (no auth)
- `/` — Homepage with hero, pricing cards, product UI mockups
- `/how-it-works` — 4-step product flow
- `/features` — Feature overview
- `/why-it-matters` — Problem cards
- `/pricing` — Pricing page
- `/for-partners` — Partner value + $124 gift CTA
- `/faq` — Homeowner FAQ
- `/about`
- `/contact`
- `/terms`
- `/privacy`

### Auth
- `/auth/login`
- `/auth/register`
- `/auth/verify` — email verification landing
- `/auth/forgot-password`
- `/auth/reset-password`

### Purchase & onboarding
- `/checkout?product=homeowner` — initiates Stripe Checkout for $189
- `/checkout?product=gift` — initiates Stripe Checkout for $124
- `/onboarding` — account + home setup (requires `onboardingToken`)
- `/gift/[token]` — gift redemption page
- `/invite/[token]` — co-owner invitation page

### Homeowner app (requires home entitlement)
- `/dashboard` — dashboard with Warranty Action Plan, timeline, counts
- `/dashboard/home` — home details, builder info, documents
- `/dashboard/issues` — issue list
- `/dashboard/issues/new` — report an issue (mobile-first)
- `/dashboard/issues/[id]` — issue detail + timeline
- `/dashboard/requests` — generated warranty requests
- `/dashboard/requests/[id]` — request preview/approve/send
- `/dashboard/calendar` — timeline of reminders, appointments, statuses
- `/dashboard/documents` — all documents, upload, missing-doc request
- `/dashboard/reminders` — reminder history and settings
- `/dashboard/reports` — generated report list and export
- `/dashboard/settings` — profile, notifications, account, co-owners
- `/dashboard/final-review` — guided final review
- `/dashboard/export` — full record export (PDF/ZIP) and download status

### Partner area (requires partner role)
- `/partner/dashboard` — gift history, stats, recommendation link/QR
- `/partner/gift` — send a gift form
- `/partner/profile` — partner profile, logo, slug
- `/[partnerSlug]` — public co-branded recommendation page (marketing + partner branding)

### Admin area (requires ADMIN role)
- `/admin/dashboard` — overview metrics
- `/admin/customers` — user search, disable, support notes
- `/admin/homes` — home search
- `/admin/purchases` — all purchases, refunds
- `/admin/gifts` — gift purchases and redemptions
- `/admin/partners` — partner approval, profiles
- `/admin/issues` — issue search (requires `VIEW_ISSUES`)
- `/admin/documents` — document search (requires `VIEW_DOCUMENTS`)
- `/admin/refunds` — refund requests/records
- `/admin/support` — support notes
- `/admin/analytics` — product analytics
- `/admin/settings` — refund window, system flags

### API routes
- `/api/auth/[...nextauth]` — NextAuth
- `/api/checkout` — create Stripe Checkout session
- `/api/stripe/webhooks` — Stripe webhook handler
- `/api/upload/presign` — generate presigned upload URL
- `/api/upload/confirm` — create Document record after upload
- `/api/cron/reminders` — Vercel Cron hourly reminder processor
- `/api/export` — create/export full record
- `/api/onboarding` — complete onboarding from token
- `/api/invite/accept` — accept co-owner invitation
- `/api/partner/recommend` — visit/conversion tracking
- `/api/admin/*` — admin CRUD endpoints
- Resource routes under `/api/homes`, `/api/issues`, `/api/documents`, `/api/reminders`, `/api/requests`, `/api/submissions`, `/api/appointments`, `/api/repair-verifications`, `/api/final-review`.

---

## 5. Homeowner Purchase Flow

1. Visitor clicks **Protect My Home — $189**.
2. Frontend POSTs `/api/checkout` with `product=homeowner` and optional email.
3. Server:
   - If logged in: uses existing `userId`.
   - If anonymous: no account exists yet; the checkout record is created without an entitlement.
   - Creates a `Purchase` record in `PENDING` status.
   - Creates a Stripe Checkout Session with `price = STRIPE_PRICE_HOMEOWNER`, `client_reference_id = purchase.id`.
   - Stripe Checkout collects the buyer email.
   - Returns `checkoutUrl`.
4. User completes payment on Stripe.
5. Stripe redirects to `/onboarding?token=...` (or `/dashboard` if already authenticated).
6. Stripe webhook `checkout.session.completed` fires:
   - Marks `Purchase` as `SUCCEEDED`.
   - Creates/links a secure `OnboardingToken` to the `Purchase`.
   - `Home` and `HomeEntitlement` are **not** created yet.
   - Sends receipt email via Resend.
7. On `/onboarding`:
   - Validate token (not expired, not used) and read purchase email from Stripe/record.
   - User sets name, password, property address, closing date, builder name.
   - Server creates `User`, `Home` (with `primaryOwnerId`), and `HomeEntitlement` linked to the `Purchase`.
   - Marks `OnboardingToken.usedAt`.
   - Better Auth creates a session.
   - Redirect to `/dashboard` with generated **Warranty Action Plan**.
8. Dashboard immediately shows:
   - Property address, closing date, days since closing.
   - Recommended review timeline (labeled *Recommended — verify with your builder documents* if not verified).
   - First documentation checklist.
   - CTA to upload warranty documents.

### Edge cases
- Duplicate checkout: unique `Purchase` per Stripe Checkout Session; idempotent webhook handling.
- Token expired: show "Resend onboarding link" that verifies the purchase and creates a new token.
- Existing user buys a second home: create new `Home` + `HomeEntitlement` linked to the new `Purchase`; skip password step.

---

## 6. Partner Gift & Redemption Flow

1. Partner signs up or logs in. Partners can self-register but require admin `MANAGE_PARTNERS` approval before their public co-branded page/logo becomes active (`isApproved`).
2. Partner completes `/partner/profile` (type, company, slug, logo).
3. On `/partner/gift`, partner enters:
   - Buyer name, buyer email, property address (optional), gift message.
4. Frontend POSTs `/api/checkout` with `product=gift` + recipient details.
5. Server:
   - Creates a `Purchase` record in `PENDING` status (productType=GIFT, userId=partnerId).
   - Creates a `GiftPurchase` record in `PENDING` status with `redemptionToken`, linked to the `Purchase`.
   - Creates Stripe Checkout Session with `price = STRIPE_PRICE_GIFT`, `client_reference_id = giftPurchase.id`, `metadata` includes partnerId.
   - Returns `checkoutUrl`.
6. Partner pays $124 on Stripe.
7. Webhook `checkout.session.completed`:
   - Marks `Purchase` and `GiftPurchase` as `SUCCEEDED`.
   - Creates an `OnboardingToken` linked to the `GiftPurchase`/`Purchase`.
   - Sends branded gift email to `recipientEmail` with `/gift/[redemptionToken]`.
8. Recipient clicks `/gift/[token]`:
   - If no account: register with email and password.
   - If account exists: log in.
   - Redemption creates `User`, `Home` (with `primaryOwnerId`), and `HomeEntitlement` linked to the `Purchase`.
   - Marks `GiftPurchase.redeemedAt` and `redeemedByUserId`.
9. Partner dashboard shows:
   - Gift sent: `createdAt`
   - Gift redeemed: `redeemedAt` (boolean only).
   - No issue, document, or builder details.

### Co-branding
- Partner slug page `/[partnerSlug]` shows partner name/logo and primary site CTA only after admin approval.
- Gift email and redemption page show "Gifted by [Partner]".
- Homeowner dashboard can show a subtle "Gifted by" module using `Home.partnerGift`.
- Builder-facing request letters and issue exports never show partner branding.

---

## 7. Stripe / Webhook Architecture

### Stripe setup
- Two **Price** objects in Stripe:
  - `STRIPE_PRICE_HOMEOWNER` = $189.00
  - `STRIPE_PRICE_GIFT` = $124.00
- One **Product** per price, or two Products.
- Checkout mode = `payment` (one-time).
- `automatic_tax` is configurable via `STRIPE_TAX_BEHAVIOR` (default `exclusive`; set to `automatic_tax` when Stripe Tax is enabled).
- Collect email on Checkout.

### Checkout creation
```ts
const session = await stripe.checkout.sessions.create({
  line_items: [{ price, quantity: 1 }],
  mode: 'payment',
  success_url: `${APP_URL}/onboarding?token=${onboardingToken.token}`,
  cancel_url: `${APP_URL}/pricing`,
  client_reference_id: purchase.id,
  customer_email: email || undefined,
  automatic_tax: STRIPE_TAX_BEHAVIOR === 'automatic_tax' ? { enabled: true } : undefined,
  metadata: { productType, purchaseId: purchase.id },
});
```

### Webhook endpoint `/api/stripe/webhooks`

**Required events:**
- `checkout.session.completed` — fulfill purchase, create entitlement, send receipt.
- `charge.refunded` — record refund, set `Purchase.status = REFUNDED`, revoke `HomeEntitlement`.
- `payment_intent.payment_failed` — mark `Purchase.status = FAILED`, notify user if known.

**Idempotency & security:**
- Verify Stripe signature with `STRIPE_WEBHOOK_SECRET`.
- Record processed event IDs in `AuditLog` or a `StripeEvent` table to avoid double-fulfillment.
- All fulfillment is idempotent: upsert `Purchase` by `stripeCheckoutSessionId`.

### Refunds
- Admin with `PROCESS_REFUNDS` can record or initiate a Stripe refund.
- Set `refundWindowDays` in admin settings (default 30).
- Refund revokes `HomeEntitlement.status = REVOKED` and sends `RefundConfirmation` email.

---

## 8. Authentication Flow

- **Better Auth** with the Prisma adapter (`better-auth/adapters/prisma`).
- Route handler at `/api/auth/[...all]` handles all auth endpoints.
- **Email/password:** enabled with `requireEmailVerification` configurable per environment.
- **Database sessions:** sessions are stored in the `Session` table and can be revoked by deleting the row.
- **Additional user fields:** `role`, `status`, `permissions`, `phone`, `smsOptIn`, `smsConsentAt`, `onboardingCompletedAt` are declared via `additionalFields` and inferred on both client and server.
- **Registration:**
  - Public registration via onboarding token or gift redemption.
  - Direct `/auth/register` is intentionally not linked for homeowner purchase flow (guest checkout first), but may exist for admin/partner accounts.
- **Email verification:**
  - Better Auth generates a verification URL; `sendVerificationEmail` dispatches via Resend.
  - Clicking the verification link sets `User.emailVerified`.
- **Password reset:**
  - Better Auth password-reset flow; `sendResetPassword` dispatches the reset URL via Resend.
- **Co-owner invitation:**
  - Primary owner invites by email.
  - `HomeInvitation` token sent.
  - Accepting creates `HomeMembership` with role `COOWNER`.

### Session shape
```ts
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    permissions: AdminPermission[];
    onboardingCompletedAt?: Date;
  };
}
```

---

## 9. File Upload, Storage & Security Design

### Storage
- **R2 bucket** with private ACL.
- Path convention: `homes/{homeId}/issues/{issueId}/{uuid}.{ext}` for issue files; `homes/{homeId}/documents/{uuid}.{ext}` for general docs.
- Keys are opaque UUIDs; no user-supplied filenames in S3 key.

### Upload flow
1. Client calls `POST /api/upload/presign` with `homeId`, optional `issueId`, `fileName`, `fileType`.
2. Server:
   - Validates session and `requireHomeAccess`.
   - Validates file type and size (images: jpg/png/webp/heic; docs: pdf; max 20 MB).
   - Creates `Document` record with `status=PENDING` and `fileKey`.
   - Generates a **presigned PUT URL** (or POST policy) with short expiry (2 minutes).
   - Returns `{ documentId, fileKey, signedUrl }`.
3. Client uploads directly to R2.
4. Client calls `POST /api/upload/confirm` with `documentId` to mark `status=ACTIVE`.
5. Server creates `Reminder` for missing-doc flows if needed.

### Download / preview
- `GET /api/documents/[id]/download` generates a presigned GET URL with 15-minute expiry.
- Never expose the raw R2 public URL.
- Image previews use the same endpoint; frontend can load via signed URL.

### Security
- File type validation on server using MIME whitelist and file extension checks.
- Optional: read first bytes with `file-type` to avoid spoofed extensions.
- Malware scanning: out of scope for launch. We restrict to images/PDFs and limit size. Future: add ClamAV/S3 Object Lambda.
- Expiring signed URLs prevent deep-linking.
- Object keys include `homeId` so an upload URL is scoped to a specific home.
- Delete marks `Document.status=DELETED`; keep object for 30 days then purge.

---

## 10. PDF Generation Approach

### Library
- `@react-pdf/renderer` with custom components in `src/lib/pdf/`.

### Templates
- `WarrantyRequestPdf.tsx` — professional builder request letter.
- `FinalReportPdf.tsx` — consolidated export of home, issues, submissions, repair history.
- `MissingWarrantyDocRequestPdf.tsx` — request for builder warranty documents.

### Flow
1. User clicks **Download PDF** or **Send Request**.
2. Server action / API route renders PDF to `Buffer`.
3. Returns `Buffer` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="..."`.

### Performance
- Mark PDF routes with `export const runtime = 'nodejs'` (not Edge).
- Render on demand; cache generated PDFs in R2 for 24h if same content requested repeatedly.
- For large exports (full record), create an `ExportJob`, run in background, email when ready.

### Vercel consideration
- PDF generation can exceed 10s for large records. Use `maxDuration: 60` (Pro plan) for export endpoints.
- If export is very large, use an async job with `ExportJob` and a status polling endpoint.

---

## 11. Email & Reminder Architecture

### Email
- **Resend** for all product-generated transactional email:
  - `AccountConfirmation`, `Welcome`, `GiftInvitation`, `GiftRedemption`, `DocumentReminder`, `IssueSubmissionReminder`, `AppointmentReminder`, `RepairVerification`, `WarrantyReview`, `PasswordReset`, `PartnerGiftConfirmation`, `RefundConfirmation`.
- **From address** `support@newhomewarrantyhq.com` (domain must be verified with SPF/DKIM/DMARC).
- **Builder-facing warranty requests** originate from the homeowner whenever possible:
  1. Homeowner creates and approves the request in-app.
  2. Offer **Send from my email** using a connected Gmail or Microsoft/Outlook account (`ConnectedEmailAccount`) so the message is sent from the homeowner’s mailbox.
  3. If no connected account, offer **Open in my email app** with a prefilled subject/body plus the PDF/attachments.
  4. If the builder requires a portal, use **Portal Mode** with copy-ready fields and capture a submission confirmation screenshot.
  5. NHWHQ email addresses are only used for product-generated communications (reminders, gift invitations, account emails, receipts, support).

### Reminder engine
- `Reminder` table stores all pending reminders.
- Vercel Cron triggers `GET /api/cron/reminders` every hour in production.
- The cron endpoint requires `CRON_SECRET` in the `Authorization` header.
- Idempotency: each `Reminder` row has a unique `idempotencyKey` (or uses its own `id`); deliveries use an `upsert`/`WHERE NOT SENT` guard so retries cannot create duplicate messages.
- Cron handler:
  1. Queries `Reminder` where `dueDate <= now()` and `status = PENDING`.
  2. Groups by `userId` and `channel`.
  3. If digest enabled and user has multiple reminders, sends one digest email.
  4. Otherwise sends individual emails/SMS.
  5. Marks `Reminder.status = SENT` and records `sentAt`.

### Reminder creation rules
| Trigger | Reminder type | Due |
|---|---|---|
| Issue created, status OPEN | `SUBMISSION_PENDING` | +48h |
| Issue submitted | `BUILDER_RESPONSE_PENDING` | +7 days |
| Appointment added | `APPOINTMENT_UPCOMING` | 24h before |
| Appointment marked complete | `REPAIR_COMPLETED_VERIFY` | +1 day |
| Issue remains OPEN > 30 days | `UNRESOLVED_ISSUES` | weekly digest |
| Closing date known | `WARRANTY_REVIEW_UPCOMING` | computed from closing |
| No builder warranty document 7 days after onboarding | `DOCUMENT_MISSING` | +7 days |
| Final review enabled | `FINAL_REVIEW` | per home age |

### Unsubscribe / settings
- Every email has an unsubscribe link for reminder emails.
- `/dashboard/settings` controls email and SMS preferences.

---

## 12. Optional SMS Architecture

- **Provider:** Twilio.
- **Enabled only if** `TWILIO_*` env vars and a verified phone number are configured.
- **Consent:**
  - User enters phone and checks SMS opt-in.
  - Record `User.smsOptIn=true` and `smsConsentAt`.
  - First SMS includes opt-out instructions.
- **Compliance:**
  - Honor `STOP`, `UNSUBSCRIBE`, `HELP` commands via Twilio webhook.
  - Store opt-out in `ReminderSetting.smsEnabled=false`.
  - No marketing SMS unless separately consented.
- **Usage:** Reminders only (`REPAIR_COMPLETED_VERIFY`, `APPOINTMENT_UPCOMING`).
- If not ready at launch, the schema and settings UI are built, but `ReminderChannel.SMS` is never assigned.

---

## 13. Partner Privacy Enforcement

### Data model separation
- Partners are `User` with `role=PARTNER`.
- Partner never gets a `HomeMembership`.
- `GiftPurchase` is the only bridge between a partner and a homeowner, and it stores only recipient name/email and redemption status.

### Code enforcement
- All issue/document/home access goes through `requireHomeAccess()`.
- `requireHomeAccess()` always returns `false` for `PARTNER` role.
- Partner endpoints query `GiftPurchase` filtered by `partnerId` only.
- `GiftPurchase` includes no `issueId`, `documentId`, or builder communications.

### Co-branding guardrails
- Partner logo/name is allowed on:
  - gift email
  - `/gift/[token]` redemption page
  - welcome screen during redemption
  - subtle "Gifted by" module on homeowner dashboard
- Partner branding is never included in:
  - `WarrantyRequest` generated content
  - `SubmissionRecord` message
  - PDF request letters
  - issue exports

---

## 14. Admin Permissions & Audit Logging

### Admin permissions
Admins are `User.role=ADMIN` with `permissions: AdminPermission[]`.

- `VIEW_USERS`: search/view customers
- `VIEW_HOMES`: search/view homes
- `VIEW_PURCHASES`: view purchases and process refunds
- `VIEW_GIFTS`: view gift purchases and redemptions
- `PROCESS_REFUNDS`: issue refunds
- `DISABLE_ACCOUNTS`: disable/enable user accounts
- `RESEND_GIFTS`: resend gift invitations
- `VIEW_ISSUES`: view homeowner issues (sensitive)
- `VIEW_DOCUMENTS`: view homeowner documents (sensitive)
- `MANAGE_PARTNERS`: approve/disapprove partners
- `MANAGE_SETTINGS`: system settings, audit logs

### Superadmin
A user whose `permissions` array contains all enum values. Initially seeded in `seed.ts`.

### Audit logging
Every admin or sensitive action calls:
```ts
await auditLog({ actorId, action, entityType, entityId, metadata, req });
```
Logged actions:
- Admin login
- Refund processed
- Account disabled/enabled
- Gift resent
- Issue/document viewed by admin
- Partner approved
- Password reset
- Export downloaded
- Role/permission changed

Audit log is append-only. Only `MANAGE_SETTINGS` can view.

---

## 15. Analytics / Event Structure

### Product analytics (in-house)
`AnalyticsEvent` table stores server-side events:

```ts
interface AnalyticsEvent {
  event: string;
  userId?: string;
  anonymousId?: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
}
```

### Tracked events
- `landing_page_view`
- `hero_cta_click` (with `cta: protect-my-home` or `give-a-gift`)
- `checkout_started`
- `checkout_completed`
- `account_activated`
- `onboarding_completed`
- `warranty_document_uploaded`
- `first_issue_created`
- `first_request_generated`
- `first_submission_recorded`
- `repair_verified`
- `final_review_completed`
- `gift_redeemed`
- `partner_repeat_gift`
- `refund_requested`
- `reminder_clicked`

### Public site analytics
- **Plausible** (or Vercel Analytics) for page views, Core Web Vitals, and conversion funnels.
- No third-party cookies or PII leakage.

### Reporting
- Admin `/admin/analytics` aggregates events with simple SQL.
- Conversion funnels: landing -> checkout -> payment -> activation -> first issue.

---

## 16. Security Protections

| Area | Implementation |
|------|----------------|
| Transport | HTTPS only (Vercel / Cloudflare). HSTS headers. |
| Auth | Auth.js sessions, `bcryptjs` password hashing, secure `httpOnly` cookies, `SameSite=Lax`. |
| RBAC | `User.role` + `AdminPermission` arrays; checked on every server action and API route. |
| Data isolation | Multi-tenancy by `homeId`; `requireHomeAccess` on all home/issue/document reads. |
| Encryption at rest | Neon Postgres encryption at rest; R2/S3 SSE; no sensitive data in file names. |
| Signed URLs | All file reads/writes use short-lived presigned URLs. |
| Upload safety | MIME whitelist, size limits, random S3 keys, `homeId` scoping. |
| Rate limiting | Upstash Redis per-IP and per-user limits on auth, checkout, upload, API. |
| CSRF | Next.js server actions handle CSRF; API routes validate `Origin`/`Referer`. |
| Input validation | `zod` schemas on all public inputs. |
| XSS | React escaping; no raw HTML; CSP headers. |
| SQL injection | Prisma parameterized queries. |
| Secrets | Vercel environment variables; no secrets in repo; `.env.example` only. |
| Error monitoring | Sentry integration. |
| Audit | `AuditLog` for admin and sensitive actions. |
| Account deletion | User can request deletion; data anonymized/hard-deleted per policy. |
| Backups | Neon automated backups + PITR; R2 versioning. |

---

## 17. Backup & Recovery Approach

- **Database:** Neon daily automated backups + point-in-time recovery (PITR) to within minutes.
- **Files:** R2 bucket versioning enabled; lifecycle rule to retain deleted objects for 30 days.
- **Code:** GitHub repository; Vercel deployments are reproducible.
- **Secrets:** Vercel env backup via export; store in 1Password / Bitwarden outside Vercel.
- **Recovery procedure:**
  1. Re-deploy latest commit to Vercel.
  2. Restore Neon DB from backup or PITR.
  3. Verify R2 bucket integrity.
  4. Re-import env secrets if needed.
  5. Smoke test checkout, login, file preview.
- **Testing:** Restore to a staging branch quarterly.

---

## 18. Deployment Architecture

### Production
- **Vercel** hosts Next.js frontend + API routes.
- **Neon** Postgres production branch.
- **Cloudflare R2** private bucket.
- **Resend** production domain.
- **Stripe** live keys.

### Staging
- Separate Vercel project or `preview` branch.
- Neon staging branch (branch from prod).
- Stripe test keys.
- R2 staging bucket.

### Cron / Jobs
- Vercel Cron triggers `api/cron/reminders` hourly.
- Large export jobs create `ExportJob` and are processed by a separate API call or Inngest job.

### CDN / Edge
- Static marketing pages served from Vercel Edge CDN.
- Dynamic app pages use Node runtime for DB access and PDF generation.

---

## 19. Environment & Secrets Management

### Local development
- `.env.example` committed to repo (no values).
- `.env.local` ignored by git.

### Required environment variables
```bash
# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=
DIRECT_DATABASE_URL=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_HOMEOWNER=
STRIPE_PRICE_GIFT=

# Storage
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN= # optional, not used for signed URLs

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Optional SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Rate limiting / caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
SENTRY_DSN=

# Admin seed
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD_HASH=
```

### Production secrets
- All stored in Vercel dashboard.
- `STRIPE_WEBHOOK_SECRET` different per environment.
- `NEXTAUTH_SECRET` generated with `openssl rand -base64 32`.
- `SEED_ADMIN_*` used only for initial deployment seed, then removed.

---

## 20. Testing Strategy

### Unit & integration
- **Vitest** for utility functions (date math, PDF content, authorization helpers).
- **React Testing Library** for form components and dashboard widgets.

### E2E
- **Playwright** tests for critical flows:
  - Signup / login / password reset
  - Homeowner purchase ($189) and onboarding
  - Gift purchase ($124) and redemption
  - Issue creation with photo upload
  - Warranty request generation and PDF download
  - Submission record creation
  - Appointment and repair verification
  - Partner privacy boundary (partner cannot view issues)
  - Co-owner invitation
  - Full record export
  - Stripe webhook handling
  - Account deletion
- Use **Stripe test keys** and **Resend test mode** in CI.

### Manual device testing
- Android Chrome
- iPhone Safari
- Desktop Chrome
- Desktop Safari
- Edge

### CI
- GitHub Actions runs lint, typecheck, unit tests, and Playwright on PRs.
- Playwright uses a test Postgres database seeded via Prisma.

---

## 21. Build Milestones (Recommended Order)

1. **Foundation & Auth**
   - Repo, Next.js + Tailwind + shadcn/ui, Prisma schema, migrations, Auth.js, login/register.
   - Vercel project, Neon DB, R2 bucket, env variables.
   - Seed superadmin and demo accounts.

2. **Public Marketing Site**
   - All public pages with SEO/OG/favicon, mobile hero, sticky CTA, navigation.
   - Generate product UI mockups (use real dashboard components rendered with demo data).

3. **Homeowner Purchase & Onboarding**
   - Stripe Checkout for $189, webhook fulfillment, receipt email.
   - Onboarding flow + Warranty Action Plan dashboard.

4. **Warranty Documents & Missing Doc Flow**
   - Upload storage, Documents section, missing-warranty-doc request generator.

5. **Issue Capture & Management**
   - Report an issue (mobile-first), issue detail, status timeline, issue categories.
   - Photo upload from phone.

6. **Request Generator, Submission & PDF**
   - Warranty request generator, approval flow, submission records (email/portal/PDF/mail), PDF download.

7. **Appointments, Reminders & Repair Verification**
   - Appointment tracking, reminder engine, repair verification, final review.

8. **Partner System**
   - Partner registration/profile, gift flow, redemption, co-branded page, privacy boundary.

9. **Admin, Analytics & Audit**
   - Admin dashboard, search, refunds, partner approval, audit logs, analytics views.

10. **QA, Security & Launch**
    - E2E tests, security review, Core Web Vitals, accessibility audit, launch.

---

## 22. Genuine Technical Risks & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Product UI mockups in hero** need to look real. | Could block public site quality. | Build dashboard UI components first, then render them inside the hero with demo data; optionally screenshot with Playwright. |
| **Serverless PDF generation** may timeout for large records. | Exports could fail. | Use Node runtime, `maxDuration` 60s, async `ExportJob` for large records, cache common PDFs. |
| **Stripe webhook development** requires Stripe CLI or deploy. | Delays testing purchase flows. | Use Stripe CLI for local forwarding; test on Vercel preview with test keys. |
| **Email deliverability** on a new domain. | Receipts/gifts may land in spam. | Use Resend, verify SPF/DKIM/DMARC, warm domain, keep sender reputation clean. |
| **Vercel function cold starts + Prisma** can be slow. | First request latency. | Use Prisma `driverAdapters` + Neon serverless driver; keep queries lean. |
| **Hourly cron may not scale** to thousands of reminders. | Missed reminders or timeouts. | Index `Reminder(dueDate, status)`, batch sends, upgrade to Inngest/QStash if needed. |
| **File upload security** (malware, abuse). | Storage abuse or malicious files. | Presigned URLs, type/size limits, rate limiting; active malware scanning deferred post-launch. |
| **Better Auth + Prisma adapter** | Schema mismatch or adapter bugs. | Validate schema with `prisma validate`, pin version, keep auth code isolated in `lib/auth.ts`. |
| **SMS compliance** (TCPA) | Legal risk if launched incorrectly. | Keep SMS optional at launch; only enable with explicit opt-in, STOP/HELP handling, and Twilio webhook. |
| **Realistic timeline without over-promising** | Warranty dates must be labeled correctly. | Compute only `Recommended Review Date` or `Estimated` unless verified by uploaded builder documents. |

---

## 23. Locked Decisions

1. **Co-owner delete rights:** A co-owner may delete an issue they personally created only while it has never been submitted. Once a `Submission` record exists, the issue is preserved; allow archive or correction instead of hard deletion.
2. **Partner approval:** Admin approval (`MANAGE_PARTNERS`) is required before a partner’s public co-branded page/logo becomes active.
3. **Homeowner purchase flow:** Guest checkout is enabled. A `Purchase` record is created before Stripe, the webhook creates an `OnboardingToken`, and `Home` + `HomeEntitlement` are created only during onboarding.
4. **Full ZIP export:** Asynchronous job + email when ready. Small/request PDFs remain synchronous.
5. **Native apps:** No iOS/Android apps at launch.

---

## 24. Conclusion

This architecture delivers the full approved product with a maintainable, type-safe monolith on Vercel + Neon + R2 + Stripe + Resend. It enforces the critical partner privacy boundary, admin permission model, and legal-language guardrails, and it provides a clear build order for moving to implementation.
