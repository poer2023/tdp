import type { Metadata } from "next";
import { FriendAuthForm } from "@/components/friends/FriendAuthForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const copy = {
  en: {
    heading: "Friend Stories",
    description: "Enter the password to unlock the memories we share.",
  },
  zh: {
    heading: "朋友故事",
    description: "输入密码，查看为你准备的专属回忆。",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "zh" ? "zh" : "en";
  return {
    title: copy[lang].heading,
    description: copy[lang].description,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function FriendsAuthPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = locale === "zh" ? "zh" : "en";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-zinc-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-900/80">
        <div className="space-y-3 text-center sm:space-y-4">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {copy[lang].heading}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{copy[lang].description}</p>
        </div>
        <div className="mt-8">
          <FriendAuthForm locale={lang} />
        </div>
      </div>
    </div>
  );
}
