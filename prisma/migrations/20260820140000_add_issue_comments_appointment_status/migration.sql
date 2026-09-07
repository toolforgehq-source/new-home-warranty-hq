-- CreateEnum
CREATE TYPE "IssueCommentDirection" AS ENUM ('HOMEOWNER', 'BUILDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "confirmationToken" TEXT,
ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED';

-- CreateTable
CREATE TABLE "issue_comment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT,
    "direction" "IssueCommentDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "emailFrom" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_comment_issueId_createdAt_idx" ON "issue_comment"("issueId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_confirmationToken_key" ON "appointment"("confirmationToken");

-- AddForeignKey
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

