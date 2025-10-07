export type AboutLocale = "en" | "zh";

type AboutHighlight = {
  label: string;
  value: string;
};

type AboutProject = {
  period: string;
  title: string;
  description: string;
  image: string;
  stack: string[];
};

type AboutGame = {
  title: string;
  description: string;
  image: string;
  progress: string;
  status: string;
};

type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  tag: string;
  heading: string;
  paragraphs: string[];
  snapshotLabel: string;
  snapshotSubtitle: string;
  highlights: AboutHighlight[];
  projectsLabel: string;
  projectsSubtitle: string;
  projects: AboutProject[];
  gamesLabel: string;
  gamesSubtitle: string;
  games: AboutGame[];
  ctaTitle: string;
  ctaDescription: string;
  ctaAction: string;
};

export const aboutLayoutClass =
  "mx-auto flex min-h-screen max-w-4xl flex-col gap-20 px-6 py-16 sm:px-8 md:px-12";

export const aboutContent: Record<AboutLocale, AboutCopy> = {
  en: {
    metaTitle: "About",
    metaDescription:
      "Peek into Hao's playground of code toys, experimental tools, and the cozy games currently on rotation.",
    tag: "About Hao",
    heading: "Documenting playful code and the games that keep me curious.",
    paragraphs: [
      "I keep the career talk short and let side experiments do the storytelling. This corner tracks the bite-sized tools, shaders, and writing companions I build for fun.",
      "When I'm not tweaking prototypes, I'm exploring narrative-heavy games or co-op adventures with friends. The overlap between mechanics and design fuels the next experiment.",
    ],
    snapshotLabel: "Quick snapshot",
    snapshotSubtitle: "Signals from the lab and the living room.",
    highlights: [
      { label: "Playground repos", value: "14" },
      { label: "Stars collected", value: "3.1k" },
      { label: "Weekend sprints", value: "2" },
      { label: "Cozy game hours", value: "8/wk" },
    ],
    projectsLabel: "Playground projects",
    projectsSubtitle: "A rotating roster of code toys I'm actively shaping.",
    projects: [
      {
        period: "2024 · Hikari Loom",
        title: "Generative typography sketchbook",
        description:
          "A GLSL-powered playground that weaves kanji strokes into animated posters and exports print-ready SVGs in one click.",
        image: "/images/about/hikari-loom.svg",
        stack: ["GLSL", "Three.js", "TypeScript"],
      },
      {
        period: "2023 · Echo Parcel",
        title: "Ambient writing companion",
        description:
          "A desktop toy that pairs keyboard cadence with synth pads, helping me stay in flow during journaling sessions.",
        image: "/images/about/echo-parcel.svg",
        stack: ["Electron", "TypeScript", "Web Audio"],
      },
      {
        period: "2022 · Orbital Pantry",
        title: "Modular task garden",
        description:
          "A Notion-integrated micro-app that grows chores into quests, making weekly routines feel a touch more whimsical.",
        image: "/images/about/orbital-pantry.svg",
        stack: ["Next.js", "Notion API", "Tailwind"],
      },
    ],
    gamesLabel: "Game shelf",
    gamesSubtitle: "Stories and systems I'm currently playing through.",
    games: [
      {
        title: "Zenless Zone Zero",
        description:
          "Inter-Knot errands by day, Hollow Zero dives by night with the Starlight Knights lineup.",
        image: "/images/about/game-zzz.svg",
        progress: "Inter-Knot Lv.38 · Hollow Zero tier 6",
        status: "Now playing",
      },
      {
        title: "Detroit: Become Human",
        description:
          "Wrapped Kara's route with a hopeful ending; replaying to rescue Connor's deviancy arc.",
        image: "/images/about/game-detroit.svg",
        progress: "Completed main story · 72% flowchart unlocked",
        status: "Recently finished",
      },
      {
        title: "Baldur's Gate 3",
        description:
          "Co-op run with friends - leaning into a bardlock build and taking every musical performance check.",
        image: "/images/about/game-bg3.svg",
        progress: "Act II · Githyanki Creche resolved",
        status: "Weekend campaign",
      },
    ],
    ctaTitle: "Let's jam on the next experiment",
    ctaDescription:
      "Share an idea, a mechanic, or a world you want to prototype - I'm up for pairing on playful builds.",
    ctaAction: "Browse project notes",
  },
  zh: {
    metaTitle: "关于 Hao",
    metaDescription: "记录 Hao 的代码玩具、实验工具，以及近期沉迷的游戏清单。",
    tag: "关于 Hao",
    heading: "少聊履历，多谈实验与游戏。",
    paragraphs: [
      "这里不长篇大论工作经历，而是汇总我正在打磨的代码玩具、生成实验与写作小工具。它们是我探索想法的沙盒。",
      "忙完开发之后，我常常沉浸在叙事向或合作类游戏里，感受机制与情绪的平衡，并把灵感带回下一次迭代。",
    ],
    snapshotLabel: "快速速写",
    snapshotSubtitle: "来自工作台与客厅的几个指标。",
    highlights: [
      { label: "Playground 仓库", value: "14" },
      { label: "GitHub 星标", value: "3.1k" },
      { label: "周末冲刺次数", value: "2" },
      { label: "游戏放松时长", value: "8h" },
    ],
    projectsLabel: "玩具实验室",
    projectsSubtitle: "近期仍在更新的代码玩具。",
    projects: [
      {
        period: "2024 · 光织字",
        title: "生成式字体草图本",
        description: "基于 GLSL 的排版实验，把汉字笔画织成动态海报，并可一键导出印刷级 SVG。",
        image: "/images/about/hikari-loom.svg",
        stack: ["GLSL", "Three.js", "TypeScript"],
      },
      {
        period: "2023 · 回声小包",
        title: "氛围写作伴侣",
        description: "把键盘敲击节奏映射到合成器音色，帮我在写日志时保持节奏感。",
        image: "/images/about/echo-parcel.svg",
        stack: ["Electron", "TypeScript", "Web Audio"],
      },
      {
        period: "2022 · 轨道储藏室",
        title: "模块化任务花园",
        description: "与 Notion 同步的微应用，把家务拆成任务卡，像经营游戏一样完成每周例行。",
        image: "/images/about/orbital-pantry.svg",
        stack: ["Next.js", "Notion API", "Tailwind"],
      },
    ],
    gamesLabel: "游戏书架",
    gamesSubtitle: "当前在体验的故事与机制。",
    games: [
      {
        title: "绝区零",
        description: "白天跑委托，晚上刷空洞零，用星见旅团搭配打爆连段。",
        image: "/images/about/game-zzz.svg",
        progress: "星见等级 38 · 空洞零 6 层",
        status: "主力推进",
      },
      {
        title: "底特律：化身为人",
        description: "Kara 线拿到温暖结局，准备重开救下 Connor 的覺醒。",
        image: "/images/about/game-detroit.svg",
        progress: "主线通关 · 流程图完成 72%",
        status: "刚通关",
      },
      {
        title: "博德之门 3",
        description: "和朋友联机慢慢推坑，主玩诗术师，路过每一次表演检定。",
        image: "/images/about/game-bg3.svg",
        progress: "第二章 · 吉斯洋基巢穴已解决",
        status: "周末战役",
      },
    ],
    ctaTitle: "欢迎丢个新点子",
    ctaDescription: "如果你想一起做实验、打磨机制或构建一个小世界，告诉我，我们可以共创。",
    ctaAction: "查看构建手记",
  },
};

export function resolveAboutLocale(locale: string | undefined): AboutLocale {
  return locale === "zh" ? "zh" : "en";
}
