-- AlterEnum
ALTER TYPE "ReminderType" ADD VALUE 'COVERAGE_ENDING';

-- AlterTable
ALTER TABLE "home" ADD COLUMN     "coverageConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "structuralWarrantyMonths" INTEGER DEFAULT 120,
ADD COLUMN     "systemsWarrantyMonths" INTEGER DEFAULT 24,
ADD COLUMN     "workmanshipWarrantyMonths" INTEGER DEFAULT 12;
