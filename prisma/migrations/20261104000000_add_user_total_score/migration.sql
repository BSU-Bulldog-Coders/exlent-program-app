ALTER TABLE "user" ADD COLUMN "total_score" SMALLINT NOT NULL DEFAULT 0;
CREATE INDEX "user_total_score_idx" ON "user"("total_score" DESC);

CREATE TABLE "score_adjustment" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "resultingScore" SMALLINT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "score_adjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "score_adjustment_idempotencyKey_key" ON "score_adjustment"("idempotencyKey");
CREATE INDEX "score_adjustment_userId_createdAt_idx" ON "score_adjustment"("userId", "createdAt");
ALTER TABLE "score_adjustment" ADD CONSTRAINT "score_adjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
