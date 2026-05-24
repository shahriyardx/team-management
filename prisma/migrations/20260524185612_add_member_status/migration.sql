-- AlterTable
ALTER TABLE "member" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "team_member" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
