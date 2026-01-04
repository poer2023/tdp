import { ImageResponse } from "next/og";
import { getMomentByIdOrSlug, type MomentImage } from "@/lib/moments";

export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  const title = (m?.content || "Moment").slice(0, 40);
  const images = (Array.isArray(m?.images) ? (m!.images as MomentImage[]) : []).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          fontSize: 36,
          color: "#111",
          padding: 40,
        }}
      >
        <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {images.map((im, i) => (
            <img
              key={i}
              src={im.url}
              alt=""
              height={360}
              width={360}
              style={{ objectFit: "cover", borderRadius: 16, border: "1px solid #e5e5e5" }}
            />
          ))}
        </div>
        <div style={{ marginTop: 24, fontSize: 20, color: "#555" }}>
          moments • {process.env.NEXT_PUBLIC_SITE_URL || "localhost"}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
