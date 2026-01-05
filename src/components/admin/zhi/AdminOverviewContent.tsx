"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useData } from "./store";
import { OverviewSection } from "./AdminComponents";

export function AdminOverviewContent() {
  const router = useRouter();
  const { posts, moments, projects, shareItems, galleryCount } = useData();

  return (
    <OverviewSection
      posts={posts}
      moments={moments}
      galleryCount={galleryCount}
      projects={projects}
      shareItems={shareItems}
      onQuickAction={(tab) => {
        const map: Record<string, string> = {
          posts: "/admin/articles",
          moments: "/admin/moments",
          gallery: "/admin/gallery",
          projects: "/admin/projects",
          curated: "/admin/curated",
        };
        const target = map[tab as string];
        if (target) router.push(target);
      }}
    />
  );
}

export default AdminOverviewContent;

