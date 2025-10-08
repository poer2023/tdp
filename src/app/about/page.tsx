import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { aboutContent, aboutLayoutClass } from "@/lib/about-content";
import { localePath } from "@/lib/locale-path";

const data = aboutContent.en;

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
};

export default function AboutPage() {
  return (
    <div className={aboutLayoutClass}>
      <section className="space-y-6">
        <span className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-1 text-xs font-medium tracking-[0.2em] text-zinc-600 uppercase dark:border-zinc-800 dark:text-zinc-400">
          {data.tag}
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            {data.heading}
          </h1>
          {data.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {data.snapshotLabel}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.snapshotSubtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-[0_8px_24px_-12px_rgba(39,39,42,0.25)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {data.projectsLabel}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.projectsSubtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {data.projects.map((item) => (
            <div
              key={item.period}
              className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 shadow-[0_18px_40px_-24px_rgba(39,39,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw"
                />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
                  <span>{item.period}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {data.gamesLabel}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.gamesSubtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data.games.map((item) => (
            <div
              key={item.title}
              className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 shadow-[0_18px_40px_-24px_rgba(39,39,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 320px, (min-width: 768px) 32vw, 100vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
                  <span>{item.status}</span>
                  <span>{item.progress}</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-100 p-8 shadow-[0_12px_40px_-15px_rgba(39,39,42,0.35)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {data.ctaTitle}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {data.ctaDescription}
            </p>
          </div>
          <Link
            href={localePath("en", "/posts")}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {data.ctaAction}
          </Link>
        </div>
      </section>
    </div>
  );
}
