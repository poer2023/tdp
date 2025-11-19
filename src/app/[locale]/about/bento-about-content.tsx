'use client';

import { motion } from 'framer-motion';
import type { BentoData } from '@/types/bento-data';
import { BentoGrid } from '@/components/about/bento/bento-grid';

interface BentoAboutContentProps {
  data: BentoData;
  locale: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function BentoAboutContent({ data, locale }: BentoAboutContentProps) {
  const greeting = locale === 'zh' ? '你好，我是' : "Hi, I'm";
  const name = locale === 'zh' ? 'Hao' : 'Hao';
  const subtitle =
    locale === 'zh'
      ? '全栈开发者 / 独立游戏爱好者 / 赛博园丁。'
      : 'Full-stack Developer / Indie Game Enthusiast / Digital Gardener.';
  const welcomeText = locale === 'zh' ? '欢迎来到我的数字切片。' : 'Welcome to my digital slice.';

  return (
    <div className="bento-background min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
              {greeting}{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                {name}
              </span>
              .
            </h1>
            <p className="max-w-lg text-lg font-medium text-slate-500">
              {subtitle}
              <br />
              {welcomeText}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white p-3 text-slate-400 shadow-sm transition-all hover:text-slate-900 hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white p-3 text-slate-400 shadow-sm transition-all hover:text-blue-400 hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="mailto:contact@example.com"
              className="rounded-full bg-white p-3 text-slate-400 shadow-sm transition-all hover:text-pink-500 hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-5xl"
        >
          <BentoGrid data={data} />
        </motion.div>
      </div>
    </div>
  );
}
