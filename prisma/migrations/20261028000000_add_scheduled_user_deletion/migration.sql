ALTER TABLE "user"
  ADD COLUMN "deletionScheduledAt" TIMESTAMP(3),
  ADD COLUMN "deletionDueAt" TIMESTAMP(3);

CREATE INDEX "user_deletionDueAt_idx" ON "user"("deletionDueAt");
