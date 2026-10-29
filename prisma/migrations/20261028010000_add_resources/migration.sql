CREATE TYPE "ResourceKind" AS ENUM ('FILE', 'YOUTUBE');
CREATE TYPE "ResourceUploadStatus" AS ENUM ('PENDING', 'READY');

CREATE TABLE "Resource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kind" "ResourceKind" NOT NULL,
  "uploadStatus" "ResourceUploadStatus" NOT NULL DEFAULT 'READY',
  "originalName" TEXT,
  "contentType" TEXT,
  "sizeBytes" INTEGER,
  "objectKey" TEXT,
  "youtubeUrl" TEXT,
  "uploadId" TEXT,
  "classId" TEXT,
  "announcementId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Resource_objectKey_key" ON "Resource"("objectKey");
CREATE INDEX "Resource_uploadStatus_createdAt_idx" ON "Resource"("uploadStatus", "createdAt");
CREATE INDEX "Resource_classId_idx" ON "Resource"("classId");
CREATE INDEX "Resource_announcementId_idx" ON "Resource"("announcementId");
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
