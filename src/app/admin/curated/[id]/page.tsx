import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { ShareItemForm } from "@/components/admin/share-item-form";

export const revalidate = 0;

type EditPageProps = {
  params: { id: string };
};

export default async function EditCuratedPage({ params }: EditPageProps) {
  const locale = await getAdminLocale();
  const item = await prisma.shareItem.findUnique({ where: { id: params.id } });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Curated</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "curated")}: {params.id}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">编辑精选条目，后续接入域名提取。</p>
      </header>

      {item ? (
        <ShareItemForm
          shareItemId={item.id}
          submitLabel="更新"
          defaultValues={{
            title: item.title,
            url: item.url,
            description: item.description,
            tags: item.tags.join(","),
            imageUrl: item.imageUrl ?? "",
          }}
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          未找到该精选条目。
        </div>
      )}
    </div>
  );
}
