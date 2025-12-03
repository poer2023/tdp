CREATE INDEX IF NOT EXISTS "ExternalCredential_platform_isValid_idx" ON "ExternalCredential"("platform", "isValid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GalleryImage_createdAt_id_idx" ON "GalleryImage"("createdAt", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GalleryImage_category_createdAt_idx" ON "GalleryImage"("category", "createdAt");
