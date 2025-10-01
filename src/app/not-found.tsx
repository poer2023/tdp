import Link from "next/link";
import FuzzyText from "@/components/fuzzy-text";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-6 py-12 text-center text-white">
      <div className="space-y-6">
        <FuzzyText baseIntensity={0.45} hoverIntensity={0.6} enableHover>
          404
        </FuzzyText>
        <p className="mx-auto max-w-xl text-sm text-zinc-400 md:text-base">
          抱歉，页面走丢了。链接可能已变更或暂不可用。
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
