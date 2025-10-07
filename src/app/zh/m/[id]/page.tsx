import { notFound } from "next/navigation";
import { getMomentByIdOrSlug, type MomentImage, type MomentVisibility } from "@/lib/moments";
import { MomentCard } from "@/components/moments/moment-card";

export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export default async function MomentDetailPageZh({ params }: Props) {
  const { id } = await params;
  const m = await getMomentByIdOrSlug(id);
  if (!m) notFound();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <MomentCard
        id={m.id}
        slug={m.slug}
        content={m.content}
        images={(m.images as unknown as MomentImage[]) ?? []}
        createdAt={m.createdAt}
        visibility={m.visibility as MomentVisibility}
        locale="zh"
      />
    </div>
  );
}
