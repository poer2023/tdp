import Link from "next/link";

export default function NotFound() {
  return (
    <>
      {/* 全屏覆盖层，隐藏 layout 的 header/footer */}
      <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-start justify-center bg-white px-6 py-16 sm:px-8 lg:px-12 dark:bg-[#1C1C1E]">
        <div className="max-w-3xl">
          {/* 超大 404 标题 */}
          <h1 className="text-[10rem] leading-none font-black tracking-tighter text-zinc-900 sm:text-[14rem] md:text-[18rem] lg:text-[22rem] dark:text-zinc-100">
            404
          </h1>

          {/* 描述文字 */}
          <p className="mt-6 text-2xl leading-relaxed text-zinc-900 sm:mt-8 sm:text-3xl md:text-4xl dark:text-zinc-100">
            Seems like we couldn&apos;t find that page, here&apos;s your way back to the{" "}
            <Link
              href="/"
              className="underline decoration-2 underline-offset-4 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              homepage
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
