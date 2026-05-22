-- CreateTable
CREATE TABLE "okr_cycle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cycleType" TEXT NOT NULL DEFAULT 'quarterly',
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "okr_cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cycleId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_result" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'number',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "key_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in" (
    "id" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyResultId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "check_in_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "okr_cycle_organizationId_idx" ON "okr_cycle"("organizationId");

-- CreateIndex
CREATE INDEX "objective_cycleId_idx" ON "objective"("cycleId");

-- CreateIndex
CREATE INDEX "objective_ownerId_idx" ON "objective"("ownerId");

-- CreateIndex
CREATE INDEX "objective_organizationId_idx" ON "objective"("organizationId");

-- CreateIndex
CREATE INDEX "key_result_objectiveId_idx" ON "key_result"("objectiveId");

-- CreateIndex
CREATE INDEX "key_result_ownerId_idx" ON "key_result"("ownerId");

-- CreateIndex
CREATE INDEX "key_result_organizationId_idx" ON "key_result"("organizationId");

-- CreateIndex
CREATE INDEX "check_in_keyResultId_idx" ON "check_in"("keyResultId");

-- CreateIndex
CREATE INDEX "check_in_authorId_idx" ON "check_in"("authorId");

-- CreateIndex
CREATE INDEX "check_in_organizationId_idx" ON "check_in"("organizationId");

-- AddForeignKey
ALTER TABLE "okr_cycle" ADD CONSTRAINT "okr_cycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "okr_cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result" ADD CONSTRAINT "key_result_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result" ADD CONSTRAINT "key_result_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result" ADD CONSTRAINT "key_result_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "key_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
