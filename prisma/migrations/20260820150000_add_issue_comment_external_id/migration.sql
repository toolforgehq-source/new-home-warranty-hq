-- AlterTable
ALTER TABLE "issue_comment" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "issue_comment_externalId_key" ON "issue_comment"("externalId");
