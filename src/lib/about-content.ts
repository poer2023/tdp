export type AboutLocale = "en" | "zh";

export const aboutLayoutClass =
  "mx-auto flex min-h-screen max-w-4xl flex-col gap-20 px-6 py-16 sm:px-8 md:px-12";

export const aboutContent: Record<
  AboutLocale,
  {
    metaTitle: string;
    metaDescription: string;
    tag: string;
    heading: string;
    paragraphs: string[];
    snapshotLabel: string;
    snapshotSubtitle: string;
    highlights: { label: string; value: string }[];
    journeyLabel: string;
    journeySubtitle: string;
    timeline: { period: string; title: string; description: string }[];
    valuesLabel: string;
    valuesSubtitle: string;
    values: { title: string; description: string }[];
    ctaTitle: string;
    ctaDescription: string;
    ctaAction: string;
  }
> = {
  en: {
    metaTitle: "About",
    metaDescription:
      "Learn more about Hao — a full-stack engineer crafting thoughtful digital experiences with Next.js and modern web tooling.",
    tag: "About Hao",
    heading: "Crafting calm, expressive experiences for the web.",
    paragraphs: [
      "I am a full-stack engineer who loves transforming complex ideas into intuitive products. My work blends human-centered design, resilient engineering, and an eye for storytelling so teams can launch with confidence.",
      "You will usually find me experimenting with Next.js, pushing design systems forward, or documenting the lessons learned along the way. Outside of shipping features, I photograph cities at dusk and chase the perfect pour-over.",
    ],
    snapshotLabel: "Snapshot",
    snapshotSubtitle: "A few signals that shape how I collaborate and build.",
    highlights: [
      { label: "Years shipping products", value: "8+" },
      { label: "Products launched", value: "25" },
      { label: "Articles & talks", value: "120" },
      { label: "Cup of coffee count", value: "∞" },
    ],
    journeyLabel: "Journey",
    journeySubtitle: "Roles, teams, and moments that shaped my perspective.",
    timeline: [
      {
        period: "2024 — Present",
        title: "Staff Engineer · Remote",
        description:
          "Leading cross-functional squads to prototype AI-assisted workflows while scaling a design system shared by marketing and product teams.",
      },
      {
        period: "2021 — 2023",
        title: "Full-stack Lead · Foo Studio",
        description:
          "Shipped immersive storytelling experiences, mentored front-end teams, and introduced performance budgets that cut load times by 37%.",
      },
      {
        period: "2018 — 2021",
        title: "Product Engineer · Various startups",
        description:
          "Built customer onboarding flows, payments, and internal tooling across SaaS products handling thousands of daily active users.",
      },
    ],
    valuesLabel: "Beliefs",
    valuesSubtitle: "Principles that guide the way I ship products.",
    values: [
      {
        title: "Craft over chaos",
        description:
          "I obsess over polish, from accessible interactions to microcopy. Every detail should reinforce trust and personality.",
      },
      {
        title: "Systems thinking",
        description:
          "Great products balance velocity with maintainability. I design architecture, tooling, and documentation that scale together.",
      },
      {
        title: "Learning in public",
        description:
          "Sharing experiments through posts, talks, and open-source keeps momentum high and invites collaboration.",
      },
    ],
    ctaTitle: "Let’s build something thoughtful",
    ctaDescription:
      "I am always excited to collaborate on playful experiments, content, or product strategy projects.",
    ctaAction: "Explore the latest writing",
  },
  zh: {
    metaTitle: "关于 Hao",
    metaDescription: "了解 Hao —— 一位善于用 Next.js 与现代 Web 工具打造沉浸式体验的全栈工程师。",
    tag: "关于 Hao",
    heading: "为网页带来沉静而富有表现力的体验。",
    paragraphs: [
      "我是一名全栈工程师，热衷把复杂的想法转化为自然顺畅的产品体验。我的工作融合以人为本的设计、可靠的工程实践与故事化的表达，帮助团队自信发布。",
      "平时我喜欢折腾 Next.js、推进设计系统、记录研发过程中的灵感与复盘。项目之外，我常在黄昏街头拍照，也在意一杯手冲咖啡的细节。",
    ],
    snapshotLabel: "个人速写",
    snapshotSubtitle: "这些信号塑造了我协作与构建产品的方式。",
    highlights: [
      { label: "产品交付年限", value: "8+" },
      { label: "上线项目数量", value: "25" },
      { label: "内容 / 演讲", value: "120" },
      { label: "咖啡摄入量", value: "∞" },
    ],
    journeyLabel: "旅程",
    journeySubtitle: "那些影响我视角的角色、团队与时刻。",
    timeline: [
      {
        period: "2024 至今",
        title: "Staff Engineer · 远程",
        description: "带领跨职能小组原型 AI 辅助工作流，并扩展服务营销与产品双端的设计系统。",
      },
      {
        period: "2021 — 2023",
        title: "全栈负责人 · Foo Studio",
        description: "交付沉浸式叙事体验、指导前端团队，并通过性能预算让加载时间降低 37%。",
      },
      {
        period: "2018 — 2021",
        title: "产品工程师 · 多家初创团队",
        description: "为多款 SaaS 产品构建用户引导、支付与内部管理工具，支撑日活上千的用户场景。",
      },
    ],
    valuesLabel: "信念",
    valuesSubtitle: "这些原则帮助我稳定、高质量地交付产品。",
    values: [
      {
        title: "在意打磨",
        description: "无障碍体验到微文案，每个细节都应传递信任与品牌质感。",
      },
      {
        title: "系统思维",
        description: "速度与可维护性可以并行。我喜欢构建能与团队一同扩展的架构、工具与文档。",
      },
      {
        title: "公开学习",
        description: "通过文章、演讲与开源分享实验，保持探索动力，也邀请更多伙伴加入。",
      },
    ],
    ctaTitle: "欢迎一起探索有趣的项目",
    ctaDescription: "如果你正在寻找合作伙伴，一起构建实验作品、内容或产品策略项目，随时联系我。",
    ctaAction: "阅读最新文章",
  },
};

export function resolveAboutLocale(locale: string | undefined): AboutLocale {
  return locale === "zh" ? "zh" : "en";
}
