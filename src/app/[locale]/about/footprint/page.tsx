import type { Metadata } from "next";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import { FootprintDashboard } from "@/components/footprint/footprint-dashboard";
import { getFootprintStats, listFootprints, getAllPolylines } from "@/lib/footprint/footprint";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;

    return {
        title: locale === "zh" ? "足迹" : "Footprint",
        description:
            locale === "zh"
                ? "查看 Hao 的历史行程足迹 - 驾驶、步行、骑行等轨迹记录"
                : "View Hao's travel footprint - driving, walking, cycling tracks and more",
    };
}

export default async function FootprintPage({ params }: PageProps) {
    const { locale } = await params;

    // Fetch data server-side
    const [stats, recentFootprints, polylines] = await Promise.all([
        getFootprintStats(),
        listFootprints({ limit: 20 }),
        getAllPolylines(),
    ]);

    return (
        <>
            <ZhiHeader />
            <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
                <FootprintDashboard
                    stats={stats}
                    recentFootprints={recentFootprints}
                    polylines={polylines}
                    locale={locale as "zh" | "en"}
                />
            </main>
            <ZhiFooter />
        </>
    );
}

export function generateStaticParams() {
    return [{ locale: "en" }, { locale: "zh" }];
}
