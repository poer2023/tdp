-- CreateIndex
CREATE INDEX "ExternalCredential_platform_isValid_idx" ON "ExternalCredential"("platform", "isValid");

-- CreateIndex
CREATE INDEX "GalleryImage_createdAt_id_idx" ON "GalleryImage"("createdAt", "id");

-- CreateIndex
CREATE INDEX "GalleryImage_category_createdAt_idx" ON "GalleryImage"("category", "createdAt");
