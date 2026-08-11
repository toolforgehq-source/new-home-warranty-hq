-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HOMEOWNER', 'PARTNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');

-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM ('VIEW_USERS', 'VIEW_HOMES', 'VIEW_PURCHASES', 'VIEW_GIFTS', 'PROCESS_REFUNDS', 'DISABLE_ACCOUNTS', 'RESEND_GIFTS', 'VIEW_ISSUES', 'VIEW_DOCUMENTS', 'MANAGE_PARTNERS', 'MANAGE_SETTINGS');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('HOMEOWNER', 'GIFT');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "HomeMembershipRole" AS ENUM ('PRIMARY', 'COOWNER');

-- CreateEnum
CREATE TYPE "HomeEntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('REALTOR', 'LENDER', 'TITLE', 'INSPECTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BUILDER_WARRANTY', 'HOMEOWNER_MANUAL', 'PURCHASE_AGREEMENT', 'ADDENDUM', 'WORKMANSHIP_STANDARDS', 'INSPECTION_REPORT', 'PUNCH_LIST', 'THIRD_PARTY_WARRANTY', 'BUILDER_INSTRUCTIONS', 'ISSUE_PHOTO', 'ISSUE_ATTACHMENT', 'SUBMISSION_CONFIRMATION', 'REPAIR_PHOTO', 'FINAL_REPORT', 'REQUEST_LETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'SUBMITTED', 'SCHEDULED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('EXTERIOR', 'ROOF', 'SIDING', 'WINDOWS', 'DOORS', 'CONCRETE', 'FOUNDATION', 'DRAINAGE', 'GARAGE', 'KITCHEN', 'BATHROOM', 'PLUMBING', 'HVAC', 'ELECTRICAL', 'FLOORING', 'CABINETS', 'COUNTERTOPS', 'WALLS_CEILING', 'BASEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "WarrantyRequestType" AS ENUM ('ISSUE', 'WARRANTY_DOCUMENT');

-- CreateEnum
CREATE TYPE "WarrantyRequestStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT');

-- CreateEnum
CREATE TYPE "SubmissionMethod" AS ENUM ('EMAIL', 'PORTAL', 'PDF', 'MAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "RepairVerificationStatus" AS ENUM ('FULLY_RESOLVED', 'PARTIALLY_RESOLVED', 'NOT_RESOLVED', 'ISSUE_RETURNED', 'NEW_DAMAGE', 'NEED_MORE_TIME');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('SUBMISSION_PENDING', 'BUILDER_RESPONSE_PENDING', 'APPOINTMENT_UPCOMING', 'REPAIR_COMPLETED_VERIFY', 'UNRESOLVED_ISSUES', 'WARRANTY_REVIEW_UPCOMING', 'DOCUMENT_MISSING', 'FINAL_REVIEW');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "GiftPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'REDEEMED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'ZIP');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ConnectedEmailProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'HOMEOWNER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" "AdminPermission"[] DEFAULT ARRAY[]::"AdminPermission"[],
    "phone" TEXT,
    "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
    "smsConsentAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "occupancyDate" TIMESTAMP(3),
    "builderName" TEXT NOT NULL,
    "builderContactName" TEXT,
    "builderEmail" TEXT,
    "builderPhone" TEXT,
    "builderWarrantyPortalUrl" TEXT,
    "thirdPartyWarrantyCompany" TEXT,
    "state" TEXT,
    "propertyCharacteristics" JSONB,
    "primaryOwnerId" TEXT NOT NULL,
    "giftPurchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_membership" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HomeMembershipRole" NOT NULL DEFAULT 'COOWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_invitation" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "HomeMembershipRole" NOT NULL DEFAULT 'COOWNER',
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productType" "ProductType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "taxBehavior" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeCustomerId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "refundedAt" TIMESTAMP(3),
    "refundAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_purchase" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "propertyAddress" TEXT,
    "giftMessage" TEXT,
    "status" "GiftPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "redeemedAt" TIMESTAMP(3),
    "redeemedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purchaseId" TEXT,
    "giftPurchaseId" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "status" "HomeEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL,
    "company" TEXT,
    "photoUrl" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "slug" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "issueId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "category" "IssueCategory" NOT NULL DEFAULT 'OTHER',
    "dateNoticed" TIMESTAMP(3),
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isWorsening" BOOLEAN NOT NULL DEFAULT false,
    "previousCommunication" TEXT,
    "previousRepairAttempt" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,

    CONSTRAINT "issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_status_history" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_request" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "issueId" TEXT,
    "type" "WarrantyRequestType" NOT NULL DEFAULT 'ISSUE',
    "generatedContent" TEXT NOT NULL,
    "requestedNextStep" TEXT,
    "status" "WarrantyRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "warranty_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachment" (
    "id" TEXT NOT NULL,
    "warrantyRequestId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_record" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "warrantyRequestId" TEXT,
    "method" "SubmissionMethod" NOT NULL,
    "destination" TEXT,
    "message" TEXT NOT NULL,
    "confirmationNumber" TEXT,
    "confirmationScreenshotId" TEXT,
    "sentFromHomeowner" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_attachment" (
    "id" TEXT NOT NULL,
    "submissionRecordId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3),
    "builderRepresentative" TEXT,
    "trade" TEXT,
    "expectedRepairDate" TIMESTAMP(3),
    "promisedActions" TEXT,
    "partsOrdered" TEXT,
    "notes" TEXT,
    "missed" BOOLEAN NOT NULL DEFAULT false,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_verification" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "RepairVerificationStatus" NOT NULL,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_verification_photo" (
    "id" TEXT NOT NULL,
    "repairVerificationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_verification_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeId" TEXT,
    "issueId" TEXT,
    "type" "ReminderType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_setting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_review" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "findings" JSONB,
    "consolidatedReportDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "ExportJobStatus" NOT NULL,
    "fileKey" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "export_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_note" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "userId" TEXT,
    "homeId" TEXT,
    "issueId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "event" TEXT NOT NULL,
    "properties" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_recommendation_visit" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "convertedUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_recommendation_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_email_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "ConnectedEmailProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_email_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "home_giftPurchaseId_key" ON "home"("giftPurchaseId");

-- CreateIndex
CREATE INDEX "home_primaryOwnerId_idx" ON "home"("primaryOwnerId");

-- CreateIndex
CREATE INDEX "home_membership_homeId_idx" ON "home_membership"("homeId");

-- CreateIndex
CREATE INDEX "home_membership_userId_idx" ON "home_membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "home_membership_homeId_userId_key" ON "home_membership"("homeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "home_invitation_token_key" ON "home_invitation"("token");

-- CreateIndex
CREATE INDEX "home_invitation_homeId_idx" ON "home_invitation"("homeId");

-- CreateIndex
CREATE INDEX "home_invitation_token_idx" ON "home_invitation"("token");

-- CreateIndex
CREATE INDEX "home_invitation_email_idx" ON "home_invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_stripePaymentIntentId_key" ON "purchase"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_stripeCheckoutSessionId_key" ON "purchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "purchase_userId_idx" ON "purchase"("userId");

-- CreateIndex
CREATE INDEX "purchase_status_idx" ON "purchase"("status");

-- CreateIndex
CREATE INDEX "purchase_productType_status_idx" ON "purchase"("productType", "status");

-- CreateIndex
CREATE INDEX "purchase_stripePaymentIntentId_idx" ON "purchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "purchase_stripeCheckoutSessionId_idx" ON "purchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_purchase_purchaseId_key" ON "gift_purchase"("purchaseId");

-- CreateIndex
CREATE INDEX "gift_purchase_partnerId_idx" ON "gift_purchase"("partnerId");

-- CreateIndex
CREATE INDEX "gift_purchase_recipientEmail_idx" ON "gift_purchase"("recipientEmail");

-- CreateIndex
CREATE INDEX "gift_purchase_redeemedByUserId_idx" ON "gift_purchase"("redeemedByUserId");

-- CreateIndex
CREATE INDEX "gift_purchase_status_idx" ON "gift_purchase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_token_token_key" ON "onboarding_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_token_purchaseId_key" ON "onboarding_token"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_token_giftPurchaseId_key" ON "onboarding_token"("giftPurchaseId");

-- CreateIndex
CREATE INDEX "onboarding_token_token_idx" ON "onboarding_token"("token");

-- CreateIndex
CREATE INDEX "onboarding_token_purchaseId_idx" ON "onboarding_token"("purchaseId");

-- CreateIndex
CREATE INDEX "onboarding_token_giftPurchaseId_idx" ON "onboarding_token"("giftPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "home_entitlement_purchaseId_key" ON "home_entitlement"("purchaseId");

-- CreateIndex
CREATE INDEX "home_entitlement_userId_idx" ON "home_entitlement"("userId");

-- CreateIndex
CREATE INDEX "home_entitlement_homeId_idx" ON "home_entitlement"("homeId");

-- CreateIndex
CREATE UNIQUE INDEX "home_entitlement_userId_homeId_key" ON "home_entitlement"("userId", "homeId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_profile_userId_key" ON "partner_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_profile_slug_key" ON "partner_profile"("slug");

-- CreateIndex
CREATE INDEX "partner_profile_slug_idx" ON "partner_profile"("slug");

-- CreateIndex
CREATE INDEX "partner_profile_isApproved_idx" ON "partner_profile"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "document_fileKey_key" ON "document"("fileKey");

-- CreateIndex
CREATE INDEX "document_homeId_issueId_type_idx" ON "document"("homeId", "issueId", "type");

-- CreateIndex
CREATE INDEX "document_homeId_type_idx" ON "document"("homeId", "type");

-- CreateIndex
CREATE INDEX "document_fileKey_idx" ON "document"("fileKey");

-- CreateIndex
CREATE INDEX "document_userId_idx" ON "document"("userId");

-- CreateIndex
CREATE INDEX "issue_homeId_status_idx" ON "issue"("homeId", "status");

-- CreateIndex
CREATE INDEX "issue_homeId_createdAt_idx" ON "issue"("homeId", "createdAt");

-- CreateIndex
CREATE INDEX "issue_homeId_isDeleted_idx" ON "issue"("homeId", "isDeleted");

-- CreateIndex
CREATE INDEX "issue_userId_idx" ON "issue"("userId");

-- CreateIndex
CREATE INDEX "issue_status_createdAt_idx" ON "issue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "issue_status_history_issueId_createdAt_idx" ON "issue_status_history"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "warranty_request_homeId_status_idx" ON "warranty_request"("homeId", "status");

-- CreateIndex
CREATE INDEX "warranty_request_issueId_idx" ON "warranty_request"("issueId");

-- CreateIndex
CREATE INDEX "warranty_request_createdBy_idx" ON "warranty_request"("createdBy");

-- CreateIndex
CREATE INDEX "request_attachment_warrantyRequestId_idx" ON "request_attachment"("warrantyRequestId");

-- CreateIndex
CREATE INDEX "request_attachment_documentId_idx" ON "request_attachment"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "request_attachment_warrantyRequestId_documentId_key" ON "request_attachment"("warrantyRequestId", "documentId");

-- CreateIndex
CREATE INDEX "submission_record_issueId_idx" ON "submission_record"("issueId");

-- CreateIndex
CREATE INDEX "submission_record_warrantyRequestId_idx" ON "submission_record"("warrantyRequestId");

-- CreateIndex
CREATE INDEX "submission_record_submittedBy_idx" ON "submission_record"("submittedBy");

-- CreateIndex
CREATE INDEX "submission_record_createdAt_idx" ON "submission_record"("createdAt");

-- CreateIndex
CREATE INDEX "submission_attachment_submissionRecordId_idx" ON "submission_attachment"("submissionRecordId");

-- CreateIndex
CREATE INDEX "submission_attachment_documentId_idx" ON "submission_attachment"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_attachment_submissionRecordId_documentId_key" ON "submission_attachment"("submissionRecordId", "documentId");

-- CreateIndex
CREATE INDEX "appointment_issueId_idx" ON "appointment"("issueId");

-- CreateIndex
CREATE INDEX "appointment_appointmentDate_idx" ON "appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "repair_verification_issueId_idx" ON "repair_verification"("issueId");

-- CreateIndex
CREATE INDEX "repair_verification_createdBy_idx" ON "repair_verification"("createdBy");

-- CreateIndex
CREATE INDEX "repair_verification_photo_repairVerificationId_idx" ON "repair_verification_photo"("repairVerificationId");

-- CreateIndex
CREATE INDEX "repair_verification_photo_documentId_idx" ON "repair_verification_photo"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "repair_verification_photo_repairVerificationId_documentId_key" ON "repair_verification_photo"("repairVerificationId", "documentId");

-- CreateIndex
CREATE INDEX "reminder_dueDate_status_idx" ON "reminder"("dueDate", "status");

-- CreateIndex
CREATE INDEX "reminder_userId_status_idx" ON "reminder"("userId", "status");

-- CreateIndex
CREATE INDEX "reminder_homeId_idx" ON "reminder"("homeId");

-- CreateIndex
CREATE INDEX "reminder_issueId_idx" ON "reminder"("issueId");

-- CreateIndex
CREATE INDEX "reminder_type_status_idx" ON "reminder"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_setting_userId_key" ON "reminder_setting"("userId");

-- CreateIndex
CREATE INDEX "final_review_homeId_idx" ON "final_review"("homeId");

-- CreateIndex
CREATE INDEX "export_job_userId_status_idx" ON "export_job"("userId", "status");

-- CreateIndex
CREATE INDEX "export_job_homeId_idx" ON "export_job"("homeId");

-- CreateIndex
CREATE INDEX "export_job_status_createdAt_idx" ON "export_job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "support_note_adminId_idx" ON "support_note"("adminId");

-- CreateIndex
CREATE INDEX "support_note_userId_idx" ON "support_note"("userId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_event_createdAt_idx" ON "analytics_event"("event", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_userId_idx" ON "analytics_event"("userId");

-- CreateIndex
CREATE INDEX "analytics_event_anonymousId_idx" ON "analytics_event"("anonymousId");

-- CreateIndex
CREATE INDEX "partner_recommendation_visit_partnerId_idx" ON "partner_recommendation_visit"("partnerId");

-- CreateIndex
CREATE INDEX "partner_recommendation_visit_convertedUserId_idx" ON "partner_recommendation_visit"("convertedUserId");

-- CreateIndex
CREATE INDEX "connected_email_account_userId_idx" ON "connected_email_account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "connected_email_account_userId_provider_email_key" ON "connected_email_account"("userId", "provider", "email");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home" ADD CONSTRAINT "home_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home" ADD CONSTRAINT "home_giftPurchaseId_fkey" FOREIGN KEY ("giftPurchaseId") REFERENCES "gift_purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_membership" ADD CONSTRAINT "home_membership_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_membership" ADD CONSTRAINT "home_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_invitation" ADD CONSTRAINT "home_invitation_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_purchase" ADD CONSTRAINT "gift_purchase_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_purchase" ADD CONSTRAINT "gift_purchase_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_purchase" ADD CONSTRAINT "gift_purchase_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_token" ADD CONSTRAINT "onboarding_token_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_token" ADD CONSTRAINT "onboarding_token_giftPurchaseId_fkey" FOREIGN KEY ("giftPurchaseId") REFERENCES "gift_purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_entitlement" ADD CONSTRAINT "home_entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_entitlement" ADD CONSTRAINT "home_entitlement_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_entitlement" ADD CONSTRAINT "home_entitlement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_profile" ADD CONSTRAINT "partner_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_request" ADD CONSTRAINT "warranty_request_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_request" ADD CONSTRAINT "warranty_request_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_request" ADD CONSTRAINT "warranty_request_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachment" ADD CONSTRAINT "request_attachment_warrantyRequestId_fkey" FOREIGN KEY ("warrantyRequestId") REFERENCES "warranty_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachment" ADD CONSTRAINT "request_attachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_record" ADD CONSTRAINT "submission_record_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_record" ADD CONSTRAINT "submission_record_warrantyRequestId_fkey" FOREIGN KEY ("warrantyRequestId") REFERENCES "warranty_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_record" ADD CONSTRAINT "submission_record_confirmationScreenshotId_fkey" FOREIGN KEY ("confirmationScreenshotId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_record" ADD CONSTRAINT "submission_record_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_submissionRecordId_fkey" FOREIGN KEY ("submissionRecordId") REFERENCES "submission_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_verification" ADD CONSTRAINT "repair_verification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_verification" ADD CONSTRAINT "repair_verification_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_verification_photo" ADD CONSTRAINT "repair_verification_photo_repairVerificationId_fkey" FOREIGN KEY ("repairVerificationId") REFERENCES "repair_verification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_verification_photo" ADD CONSTRAINT "repair_verification_photo_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_setting" ADD CONSTRAINT "reminder_setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_review" ADD CONSTRAINT "final_review_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_note" ADD CONSTRAINT "support_note_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_recommendation_visit" ADD CONSTRAINT "partner_recommendation_visit_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_email_account" ADD CONSTRAINT "connected_email_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
