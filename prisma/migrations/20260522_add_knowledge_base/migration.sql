-- Create knowledge base tables
CREATE TABLE IF NOT EXISTS "kb_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "kb_category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kb_subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "kb_subcategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kb_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "kb_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kb_attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kbItemId" TEXT NOT NULL,

    CONSTRAINT "kb_attachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kb_link" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kbItemId" TEXT NOT NULL,

    CONSTRAINT "kb_link_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "kb_category_organizationId_idx" ON "kb_category"("organizationId");
CREATE INDEX IF NOT EXISTS "kb_subcategory_categoryId_idx" ON "kb_subcategory"("categoryId");
CREATE INDEX IF NOT EXISTS "kb_subcategory_organizationId_idx" ON "kb_subcategory"("organizationId");
CREATE INDEX IF NOT EXISTS "kb_item_subcategoryId_idx" ON "kb_item"("subcategoryId");
CREATE INDEX IF NOT EXISTS "kb_item_organizationId_idx" ON "kb_item"("organizationId");
CREATE INDEX IF NOT EXISTS "kb_attachment_kbItemId_idx" ON "kb_attachment"("kbItemId");
CREATE INDEX IF NOT EXISTS "kb_link_kbItemId_idx" ON "kb_link"("kbItemId");

-- Foreign keys
ALTER TABLE "kb_category" ADD CONSTRAINT "kb_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_subcategory" ADD CONSTRAINT "kb_subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "kb_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_subcategory" ADD CONSTRAINT "kb_subcategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_item" ADD CONSTRAINT "kb_item_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "kb_subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_item" ADD CONSTRAINT "kb_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_item" ADD CONSTRAINT "kb_item_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_attachment" ADD CONSTRAINT "kb_attachment_kbItemId_fkey" FOREIGN KEY ("kbItemId") REFERENCES "kb_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_link" ADD CONSTRAINT "kb_link_kbItemId_fkey" FOREIGN KEY ("kbItemId") REFERENCES "kb_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
