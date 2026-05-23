-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnail" TEXT,
    "enableComments" BOOLEAN NOT NULL DEFAULT true,
    "enableLikes" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "announcementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "announcement_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_like" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "announcement_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_link" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "announcement_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcement_organizationId_idx" ON "announcement"("organizationId");

-- CreateIndex
CREATE INDEX "announcement_teamId_idx" ON "announcement"("teamId");

-- CreateIndex
CREATE INDEX "announcement_createdAt_idx" ON "announcement"("createdAt");

-- CreateIndex
CREATE INDEX "announcement_comment_announcementId_idx" ON "announcement_comment"("announcementId");

-- CreateIndex
CREATE INDEX "announcement_comment_parentId_idx" ON "announcement_comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_like_announcementId_userId_key" ON "announcement_like"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "announcement_attachment_announcementId_idx" ON "announcement_attachment"("announcementId");

-- CreateIndex
CREATE INDEX "announcement_link_announcementId_idx" ON "announcement_link"("announcementId");

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comment" ADD CONSTRAINT "announcement_comment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comment" ADD CONSTRAINT "announcement_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comment" ADD CONSTRAINT "announcement_comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "announcement_comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_like" ADD CONSTRAINT "announcement_like_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_like" ADD CONSTRAINT "announcement_like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_attachment" ADD CONSTRAINT "announcement_attachment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_link" ADD CONSTRAINT "announcement_link_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
