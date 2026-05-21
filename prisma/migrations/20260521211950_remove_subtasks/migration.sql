/*
  Warnings:

  - You are about to drop the column `parentId` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_parentId_fkey";

-- DropIndex
DROP INDEX "task_parentId_idx";

-- AlterTable
ALTER TABLE "task" DROP COLUMN "parentId";
