"use client";

import { Surface as HeroUISurface } from "@heroui/react";
import type { SurfaceProps as HeroUISurfaceProps } from "@heroui/react";

type SurfaceVariantOverride = "flat" | "bordered";

export interface SurfaceProps extends Omit<HeroUISurfaceProps, "variant"> {
  variant?: HeroUISurfaceProps["variant"] | SurfaceVariantOverride;
}

const VARIANT_MAP: Record<SurfaceVariantOverride, HeroUISurfaceProps["variant"]> = {
  flat: "secondary",
  bordered: "tertiary",
};

const isOverrideVariant = (value: string): value is SurfaceVariantOverride =>
  value === "flat" || value === "bordered";

export function Surface({ variant, ...props }: SurfaceProps) {
  const resolvedVariant = variant
    ? isOverrideVariant(variant)
      ? VARIANT_MAP[variant]
      : variant
    : undefined;
  return <HeroUISurface variant={resolvedVariant} {...props} />;
}
