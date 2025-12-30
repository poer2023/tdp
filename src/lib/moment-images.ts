import type { MomentImage } from "@/lib/moments";

type MomentImageVariant = "micro" | "small" | "medium" | "full";

const pickUrl = (candidates: Array<string | null | undefined>, fallback: string) => {
  for (const url of candidates) {
    if (typeof url === "string" && url.length > 0) return url;
  }
  return fallback;
};

export function getMomentImageUrl(
  image: MomentImage,
  variant: MomentImageVariant = "small"
): string {
  switch (variant) {
    case "micro":
      return pickUrl(
        [image.microThumbUrl, image.smallThumbUrl, image.previewUrl, image.mediumUrl, image.url],
        image.url
      );
    case "medium":
      return pickUrl(
        [image.mediumUrl, image.smallThumbUrl, image.previewUrl, image.url],
        image.url
      );
    case "full":
      return pickUrl(
        [image.url, image.mediumUrl, image.smallThumbUrl, image.previewUrl, image.microThumbUrl],
        image.url
      );
    case "small":
    default:
      return pickUrl(
        [image.smallThumbUrl, image.previewUrl, image.mediumUrl, image.url, image.microThumbUrl],
        image.url
      );
  }
}
