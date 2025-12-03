import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { MomentForm } from "@/components/admin/moment-form";

export const revalidate = 0;

type EditPageProps = {
  params: { id: string };
};

export default async function EditMomentPage({ params }: EditPageProps) {
  const locale = await getAdminLocale();
  const moment = await prisma.moment.findUnique({ where: { id: params.id } });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Moments</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {t(locale, "moments")}: {params.id}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          编辑瞬间内容，后续会替换为服务器数据填充。
        </p>
      </header>

      {moment ? (
        <MomentForm
          momentId={moment.id}
          submitLabel="更新"
          defaultValues={{
            content: moment.content,
            tags: moment.tags.join(","),
            visibility: moment.visibility as "PUBLIC" | "FRIEND_ONLY" | "PRIVATE",
            location:
              typeof moment.location === "object" && moment.location !== null
                ? (moment.location as any)?.name ?? ""
                : "",
            images: Array.isArray(moment.images) ? (moment.images as string[]) : [],
          }}
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          未找到该瞬间。
        </div>
      )}
    </div>
  );
}
