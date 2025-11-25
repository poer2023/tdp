"use client";

import React, { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Github,
  ExternalLink,
  MousePointer2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import { getLocaleFromPathname } from "@/lib/i18n";

export interface LuminaProject {
  id: string;
  year: string;
  role: string;
  title: string;
  description: string;
  features?: string[];
  technologies: string[];
  imageUrl: string;
  demoUrl?: string;
  repoUrl?: string;
  stats?: { label: string; value: string }[];
}

interface ProjectSlideProps {
  project: LuminaProject;
  index: number;
  total: number;
}

function ProjectSlide({ project, index, total }: ProjectSlideProps) {
  const isEven = index % 2 === 0;
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.3, once: false });
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Live Demo": "Live Demo",
        "Source Code": "Source Code",
      },
      zh: {
        "Live Demo": "在线演示",
        "Source Code": "源代码",
      },
    };
    return translations[locale]?.[key] || key;
  };

  // Mouse Parallax Logic
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMouseX(clientX / innerWidth - 0.5);
    setMouseY(clientY / innerHeight - 0.5);
  };

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Parallax transforms for different layers
  const moveLayer1 = {
    x: useTransform(x, (value) => value * -20),
    y: useTransform(y, (value) => value * -20),
  };
  const moveLayer2 = {
    x: useTransform(x, (value) => value * 30),
    y: useTransform(y, (value) => value * 30),
  };
  const moveLayer3 = {
    x: useTransform(x, (value) => value * 10),
    y: useTransform(y, (value) => value * 10),
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[100dvh] w-full snap-start items-center overflow-hidden bg-stone-50 dark:bg-stone-950"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:gap-20 lg:px-8 lg:py-0">
        {/* Left: Content Side */}
        <motion.div
          className={`flex flex-1 flex-col justify-center order-2 ${isEven ? "lg:order-1" : "lg:order-2"}`}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Header Meta */}
          <motion.div
            variants={itemVariants}
            className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
          >
            <span className="text-stone-400">{project.year}</span>
            <span className="h-1 w-1 rounded-full bg-stone-300" />
            <span className="text-sage-600 dark:text-sage-400">{project.role}</span>
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="mb-6 font-serif text-4xl leading-tight text-stone-900 md:text-6xl dark:text-stone-100"
          >
            {project.title}
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="mb-8 max-w-lg text-lg leading-relaxed text-stone-600 dark:text-stone-400"
          >
            {project.description}
          </motion.p>

          {/* Features Grid (Bento Mini) */}
          {project.features && project.features.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {project.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-stone-100 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
                >
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-sage-500" />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tech Stack */}
          <motion.div variants={itemVariants} className="mb-10 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded border border-stone-200 bg-stone-200/50 px-3 py-1.5 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400"
              >
                {tech}
              </span>
            ))}
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex gap-4">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 dark:bg-stone-100 dark:text-stone-900"
              >
                {t("Live Demo")} <ExternalLink size={16} />
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {t("Source Code")} <Github size={16} />
              </a>
            )}
          </motion.div>
        </motion.div>

        {/* Right: Visual Composition Side */}
        <div
          className={`relative flex flex-1 items-center justify-center order-1 ${isEven ? "lg:order-2" : "lg:order-1"}`}
        >
          {/* Abstract Backdrop */}
          <div className="absolute inset-0 scale-75 transform rounded-[3rem] bg-gradient-to-tr from-stone-200/30 to-sage-200/30 blur-3xl dark:from-stone-800/30 dark:to-sage-900/10" />

          <div className="relative aspect-[4/3] w-full max-w-xl">
            {/* Layer 1: Main Desktop Screenshot */}
            <motion.div
              style={moveLayer1}
              className="absolute left-0 top-0 z-10 aspect-video w-[90%] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-800"
            >
              {/* Fake Browser UI */}
              <div className="flex h-6 items-center gap-1.5 border-b border-stone-200 bg-stone-100 px-3 dark:border-stone-800 dark:bg-stone-900">
                <div className="h-2 w-2 rounded-full bg-rose-400/50" />
                <div className="h-2 w-2 rounded-full bg-amber-400/50" />
                <div className="h-2 w-2 rounded-full bg-emerald-400/50" />
              </div>
              <img
                src={project.imageUrl}
                alt="Desktop"
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Layer 2: Mobile/Detail Floating Shot */}
            <motion.div
              style={moveLayer2}
              className="absolute -bottom-8 right-4 z-20 aspect-[9/19] w-[35%] overflow-hidden rounded-[2rem] border-[4px] border-stone-800 bg-stone-900 shadow-2xl ring-1 ring-white/10"
            >
              {/* Mobile Notch/Phone header */}
              <div className="absolute inset-x-0 top-0 z-10 flex h-6 justify-center bg-black/20">
                <div className="h-4 w-16 rounded-b-lg bg-black" />
              </div>
              <img
                src={project.imageUrl}
                alt="Mobile"
                className="h-full w-full scale-[2] object-cover"
              />
            </motion.div>

            {/* Layer 3: Floating Stat Card / Decoration */}
            {project.stats && project.stats[0] && (
              <motion.div
                style={moveLayer3}
                className="absolute -right-8 top-12 z-30 flex items-center gap-3 rounded-xl border border-white/20 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/80"
              >
                <div className="rounded-lg bg-sage-100 p-2 text-sage-600 dark:bg-sage-900/30 dark:text-sage-400">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
                    {project.stats[0].label}
                  </div>
                  <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
                    {project.stats[0].value}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface LuminaProjectsProps {
  projects: LuminaProject[];
}

export function LuminaProjects({ projects }: LuminaProjectsProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        Scroll: "Scroll",
      },
      zh: {
        Scroll: "滚动",
      },
    };
    return translations[locale]?.[key] || key;
  };

  return (
    <div className="no-scrollbar h-screen w-full snap-y snap-mandatory scroll-smooth overflow-y-scroll bg-stone-50 dark:bg-stone-950">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {projects.map((project, index) => (
        <ProjectSlide
          key={project.id}
          project={project}
          index={index}
          total={projects.length}
        />
      ))}

      {/* Scroll Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 2, duration: 2, repeat: Infinity }}
        className="pointer-events-none fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 text-stone-400 mix-blend-difference dark:text-stone-500"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {t("Scroll")}
        </span>
        <MousePointer2 size={16} />
      </motion.div>

      {/* Side Pagination */}
      <div className="fixed right-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        {projects.map((_, idx) => (
          <div
            key={idx}
            className="h-1.5 w-1.5 rounded-full bg-stone-300 transition-colors dark:bg-stone-700"
          />
        ))}
      </div>
    </div>
  );
}

export default LuminaProjects;
