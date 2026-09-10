-- CreateTable
CREATE TABLE "TestAssignment" (
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TestAssignment_pkey" PRIMARY KEY ("testId","userId")
);

-- AddForeignKey
ALTER TABLE "TestAssignment" ADD CONSTRAINT "TestAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAssignment" ADD CONSTRAINT "TestAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
