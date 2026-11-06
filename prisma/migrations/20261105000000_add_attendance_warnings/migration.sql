-- CreateEnum
CREATE TYPE "AttendanceWarningStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "attendanceCheckedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AttendanceWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "previousClassId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "AttendanceWarningStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "leaseId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceWarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceWarning_idempotencyKey_key" ON "AttendanceWarning"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AttendanceWarning_userId_createdAt_idx" ON "AttendanceWarning"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AttendanceWarning_status_nextAttemptAt_idx" ON "AttendanceWarning"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceWarning_userId_classId_key" ON "AttendanceWarning"("userId", "classId");

-- AddForeignKey
ALTER TABLE "AttendanceWarning" ADD CONSTRAINT "AttendanceWarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceWarning" ADD CONSTRAINT "AttendanceWarning_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceWarning" ADD CONSTRAINT "AttendanceWarning_previousClassId_fkey" FOREIGN KEY ("previousClassId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Classes closed before this check existed are marked as already checked, so the
-- daily sweep never warns students retroactively about old classes.
UPDATE "Class" SET "attendanceCheckedAt" = COALESCE("closedAt", CURRENT_TIMESTAMP) WHERE "status" = 'CLOSED';
