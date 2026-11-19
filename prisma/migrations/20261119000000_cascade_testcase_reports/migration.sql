ALTER TABLE "TestcaseReport" DROP CONSTRAINT "TestcaseReport_testcaseId_fkey";
ALTER TABLE "TestcaseReport" ADD CONSTRAINT "TestcaseReport_testcaseId_fkey"
  FOREIGN KEY ("testcaseId") REFERENCES "TestcaseRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
