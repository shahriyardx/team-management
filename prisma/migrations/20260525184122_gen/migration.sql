-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "metadata" TEXT;

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

-- CreateIndex
CREATE INDEX "two_factor_secret_idx" ON "two_factor"("secret");
