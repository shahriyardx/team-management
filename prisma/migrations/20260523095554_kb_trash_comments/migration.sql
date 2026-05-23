-- AlterTable
ALTER TABLE "kb_item" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "kb_comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kbItemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "kb_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_edit_history" (
    "id" TEXT NOT NULL,
    "kbItemId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" TEXT NOT NULL,

    CONSTRAINT "kb_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kb_comment_kbItemId_idx" ON "kb_comment"("kbItemId");

-- CreateIndex
CREATE INDEX "kb_edit_history_kbItemId_idx" ON "kb_edit_history"("kbItemId");

-- AddForeignKey
ALTER TABLE "kb_comment" ADD CONSTRAINT "kb_comment_kbItemId_fkey" FOREIGN KEY ("kbItemId") REFERENCES "kb_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_comment" ADD CONSTRAINT "kb_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_edit_history" ADD CONSTRAINT "kb_edit_history_kbItemId_fkey" FOREIGN KEY ("kbItemId") REFERENCES "kb_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_edit_history" ADD CONSTRAINT "kb_edit_history_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
