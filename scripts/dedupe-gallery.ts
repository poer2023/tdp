import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type GI = {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  postId: string | null;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  city: string | null;
  country: string | null;
  livePhotoVideoPath: string | null;
  isLivePhoto: boolean;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  capturedAt: Date | null;
  storageType: string;
};

function completeness(g: GI): number {
  const fields = [
    g.title,
    g.description,
    g.postId,
    g.latitude,
    g.longitude,
    g.locationName,
    g.city,
    g.country,
    g.livePhotoVideoPath,
    g.fileSize,
    g.width,
    g.height,
    g.mimeType,
    g.capturedAt,
  ];
  return (
    fields.reduce((s, v) => s + (v === null || v === undefined ? 0 : 1), 0) +
    (g.isLivePhoto ? 1 : 0)
  );
}

async function main() {
  console.log("🔎 Scanning gallery images for duplicates by filePath...");

  const grouped = await prisma.galleryImage.groupBy({
    by: ["filePath"],
    _count: { filePath: true },
    having: { filePath: { _count: { gt: 1 } } },
  });

  if (!grouped.length) {
    console.log("✅ No duplicates found. Nothing to do.");
    return;
  }

  let removed = 0;
  let merged = 0;

  for (const g of grouped) {
    const list = (await prisma.galleryImage.findMany({
      where: { filePath: g.filePath },
    })) as unknown as GI[];
    if (list.length <= 1) continue;

    // pick the most complete; tie-breaker: earliest createdAt
    const sorted = list.sort((a, b) => {
      const diff = completeness(b) - completeness(a);
      if (diff !== 0) return diff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const keep = sorted[0];
    const rest = sorted.slice(1);

    // Merge selected fields from others into keep if missing
    const mergedData: Prisma.GalleryImageUpdateInput = {};
    for (const r of rest) {
      if (mergedData.title === undefined && keep.title == null && r.title)
        mergedData.title = r.title;
      if (mergedData.description === undefined && keep.description == null && r.description)
        mergedData.description = r.description;
      if (mergedData.postId === undefined && keep.postId == null && r.postId)
        mergedData.postId = r.postId;
      if (mergedData.latitude === undefined && keep.latitude == null && r.latitude != null)
        mergedData.latitude = r.latitude;
      if (mergedData.longitude === undefined && keep.longitude == null && r.longitude != null)
        mergedData.longitude = r.longitude;
      if (mergedData.locationName === undefined && keep.locationName == null && r.locationName)
        mergedData.locationName = r.locationName;
      if (mergedData.city === undefined && keep.city == null && r.city) mergedData.city = r.city;
      if (mergedData.country === undefined && keep.country == null && r.country)
        mergedData.country = r.country;
      if (
        mergedData.livePhotoVideoPath === undefined &&
        keep.livePhotoVideoPath == null &&
        r.livePhotoVideoPath
      )
        mergedData.livePhotoVideoPath = r.livePhotoVideoPath;
      if (mergedData.fileSize === undefined && keep.fileSize == null && r.fileSize != null)
        mergedData.fileSize = r.fileSize;
      if (mergedData.width === undefined && keep.width == null && r.width != null)
        mergedData.width = r.width;
      if (mergedData.height === undefined && keep.height == null && r.height != null)
        mergedData.height = r.height;
      if (mergedData.mimeType === undefined && keep.mimeType == null && r.mimeType)
        mergedData.mimeType = r.mimeType;
      if (mergedData.capturedAt === undefined && keep.capturedAt == null && r.capturedAt)
        mergedData.capturedAt = r.capturedAt;
      if (mergedData.storageType === undefined && keep.storageType == null && r.storageType)
        mergedData.storageType = r.storageType;
    }

    if (Object.keys(mergedData).length > 0) {
      await prisma.galleryImage.update({ where: { id: keep.id }, data: mergedData });
      merged += 1;
    }

    // Delete the rest
    const idsToDelete = rest.map((r) => r.id);
    await prisma.galleryImage.deleteMany({ where: { id: { in: idsToDelete } } });
    removed += idsToDelete.length;

    console.log(`• filePath=${g.filePath} → kept=${keep.id}, removed=${idsToDelete.length}`);
  }

  console.log(`\n✅ Dedupe finished. Groups merged: ${merged}, Rows removed: ${removed}`);
}

main()
  .catch((e) => {
    console.error("❌ Dedupe failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
