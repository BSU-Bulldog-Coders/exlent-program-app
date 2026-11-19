-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExerciseRunStatus" AS ENUM ('RUNNING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "TestcaseResultStatus" AS ENUM ('PASSED', 'FAILED', 'UNFINISHED');

-- CreateEnum
CREATE TYPE "TestcaseReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "status" "ExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorId" TEXT NOT NULL,
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseClass" (
    "exerciseId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "ExerciseClass_pkey" PRIMARY KEY ("exerciseId","classId")
);

-- CreateTable
CREATE TABLE "ExerciseRevision" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestcaseRevision" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,

    CONSTRAINT "TestcaseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latestRunId" TEXT,
    "passedRevisionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseRun" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ExerciseRunStatus" NOT NULL DEFAULT 'RUNNING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestcaseResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "testcaseId" TEXT NOT NULL,
    "status" "TestcaseResultStatus" NOT NULL,
    "actualOutput" TEXT,
    "error" TEXT,

    CONSTRAINT "TestcaseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestcaseReport" (
    "id" TEXT NOT NULL,
    "testcaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TestcaseReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestcaseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_currentRevisionId_key" ON "Exercise"("currentRevisionId");

-- CreateIndex
CREATE INDEX "Exercise_status_createdAt_idx" ON "Exercise"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseClass_classId_idx" ON "ExerciseClass"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseRevision_exerciseId_number_key" ON "ExerciseRevision"("exerciseId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "TestcaseRevision_revisionId_position_key" ON "TestcaseRevision"("revisionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseProgress_latestRunId_key" ON "ExerciseProgress"("latestRunId");

-- CreateIndex
CREATE INDEX "ExerciseProgress_userId_idx" ON "ExerciseProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseProgress_exerciseId_userId_key" ON "ExerciseProgress"("exerciseId", "userId");

-- CreateIndex
CREATE INDEX "ExerciseRun_userId_createdAt_idx" ON "ExerciseRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseRun_exerciseId_userId_createdAt_idx" ON "ExerciseRun"("exerciseId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestcaseResult_runId_testcaseId_key" ON "TestcaseResult"("runId", "testcaseId");

-- CreateIndex
CREATE INDEX "TestcaseReport_status_createdAt_idx" ON "TestcaseReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "ExerciseRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseClass" ADD CONSTRAINT "ExerciseClass_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseClass" ADD CONSTRAINT "ExerciseClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseRevision" ADD CONSTRAINT "ExerciseRevision_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestcaseRevision" ADD CONSTRAINT "TestcaseRevision_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ExerciseRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_latestRunId_fkey" FOREIGN KEY ("latestRunId") REFERENCES "ExerciseRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_passedRevisionId_fkey" FOREIGN KEY ("passedRevisionId") REFERENCES "ExerciseRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseRun" ADD CONSTRAINT "ExerciseRun_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseRun" ADD CONSTRAINT "ExerciseRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseRun" ADD CONSTRAINT "ExerciseRun_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ExerciseRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestcaseResult" ADD CONSTRAINT "TestcaseResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExerciseRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestcaseResult" ADD CONSTRAINT "TestcaseResult_testcaseId_fkey" FOREIGN KEY ("testcaseId") REFERENCES "TestcaseRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestcaseReport" ADD CONSTRAINT "TestcaseReport_testcaseId_fkey" FOREIGN KEY ("testcaseId") REFERENCES "TestcaseRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestcaseReport" ADD CONSTRAINT "TestcaseReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE UNIQUE INDEX "TestcaseReport_one_open" ON "TestcaseReport" ("testcaseId", "userId") WHERE "status" = 'OPEN';
