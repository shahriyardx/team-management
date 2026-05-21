/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_assigneeId_fkey";

-- DropIndex
DROP INDEX "task_assigneeId_idx";

-- AlterTable
ALTER TABLE "task" DROP COLUMN "assigneeId",
ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "task_assignee" (
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "task_assignee_pkey" PRIMARY KEY ("taskId","memberId")
);

-- CreateTable
CREATE TABLE "label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_label" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "task_label_pkey" PRIMARY KEY ("taskId","labelId")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_assignee_taskId_idx" ON "task_assignee"("taskId");

-- CreateIndex
CREATE INDEX "task_assignee_memberId_idx" ON "task_assignee"("memberId");

-- CreateIndex
CREATE INDEX "label_organizationId_idx" ON "label"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "label_name_organizationId_key" ON "label"("name", "organizationId");

-- CreateIndex
CREATE INDEX "task_label_taskId_idx" ON "task_label"("taskId");

-- CreateIndex
CREATE INDEX "task_label_labelId_idx" ON "task_label"("labelId");

-- CreateIndex
CREATE INDEX "comment_taskId_idx" ON "comment"("taskId");

-- CreateIndex
CREATE INDEX "notification_userId_read_idx" ON "notification"("userId", "read");

-- CreateIndex
CREATE INDEX "notification_organizationId_idx" ON "notification"("organizationId");

-- CreateIndex
CREATE INDEX "task_parentId_idx" ON "task"("parentId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label" ADD CONSTRAINT "label_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
