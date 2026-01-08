import Link from "next/link";
import { headers } from "next/headers";

export default async function ForbiddenPage() {
    const headersList = await headers();
    const locale = headersList.get("x-locale") || "en";
    const isZh = locale === "zh";
    const homeHref = isZh ? "/zh" : "/";

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4 text-stone-800 dark:bg-stone-950 dark:text-stone-100">
            <div className="text-center">
                <h1 className="text-7xl font-bold text-stone-300 dark:text-stone-700">403</h1>
                <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
                    {isZh ? "禁止访问 - 需要管理员权限" : "Forbidden - Admin access required"}
                </p>
                <Link
                    href={homeHref}
                    className="mt-8 inline-block rounded-lg bg-sage-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sage-700"
                >
                    {isZh ? "返回首页" : "Return Home"}
                </Link>
            </div>
        </main>
    );
}
