-- CreateEnum
CREATE TYPE "ClassReminderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "ClassReminder" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ClassReminderStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "leaseId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassReminder_idempotencyKey_key" ON "ClassReminder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ClassReminder_status_nextAttemptAt_idx" ON "ClassReminder"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClassReminder_classId_userId_key" ON "ClassReminder"("classId", "userId");

-- AddForeignKey
ALTER TABLE "ClassReminder" ADD CONSTRAINT "ClassReminder_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReminder" ADD CONSTRAINT "ClassReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
