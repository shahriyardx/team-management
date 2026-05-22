-- Drop old team tables to use better-auth team schema
DROP INDEX IF EXISTS "team_member_teamId_memberId_key";
DROP INDEX IF EXISTS "team_member_memberId_idx";
DROP INDEX IF EXISTS "team_member_teamId_idx";
DROP INDEX IF EXISTS "team_organizationId_idx";
ALTER TABLE IF EXISTS "team_member" DROP CONSTRAINT IF EXISTS "team_member_memberId_fkey";
ALTER TABLE IF EXISTS "team_member" DROP CONSTRAINT IF EXISTS "team_member_teamId_fkey";
ALTER TABLE IF EXISTS "team" DROP CONSTRAINT IF EXISTS "team_leaderId_fkey";
ALTER TABLE IF EXISTS "team" DROP CONSTRAINT IF EXISTS "team_organizationId_fkey";
DROP TABLE IF EXISTS "team_member";
DROP TABLE IF EXISTS "team";

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "team_member_teamId_idx" ON "team_member"("teamId");

-- CreateIndex
CREATE INDEX "team_member_userId_idx" ON "team_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_userId_key" ON "team_member"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
