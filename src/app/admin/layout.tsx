import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/posts", label: "文章管理" },
  { href: "/admin/gallery", label: "相册" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-inner">
              <Image src="/favicon.ico" alt="Logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-semibold">后台中心</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">管理文章与相册</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {session?.user ? (
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "管理员"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">{session.user.name ?? "管理员"}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {session.user.email}
                  </span>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-6 py-10 sm:px-8 md:px-12">
        {children}
      </main>
    </div>
  );
}
