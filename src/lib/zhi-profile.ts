export type ZhiProfile = {
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
};

const profileConfig: Record<"en" | "zh", ZhiProfile> = {
  en: {
    name: "Zhi",
    title: "Product & Engineering",
    bio: "Designing and shipping calm tools. Obsessed with UX, data, and the craft of building.",
  },
  zh: {
    name: "知",
    title: "产品 / 工程",
    bio: "把混乱变成路线图，专注体验、数据与产品打磨。",
  },
};

export function getZhiProfile(locale: "en" | "zh"): ZhiProfile {
  return profileConfig[locale] ?? profileConfig.en;
}
