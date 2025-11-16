"use client";

import { Chip as HeroUIChip } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Chip 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/chip
 *
 * 用于状态标签、标签展示等场景
 * 支持多种颜色变体和尺寸
 *
 * 映射 status 到 variant
 */

type BaseChipProps = ComponentProps<typeof HeroUIChip>;

type ExtendedColor = "primary" | "secondary";

const isExtendedColor = (value: string): value is ExtendedColor =>
  value === "primary" || value === "secondary";

const EXTENDED_COLOR_MAP: Record<ExtendedColor, BaseChipProps["color"]> = {
  primary: "accent",
  secondary: "default",
};

export interface ChipProps extends Omit<BaseChipProps, "variant" | "color"> {
  status?: "default" | "primary" | "secondary" | "success" | "danger" | "accent" | "warning";
  variant?: BaseChipProps["variant"] | "flat";
  color?: BaseChipProps["color"] | ExtendedColor;
}

export function Chip({ status, children, variant, color, ...props }: ChipProps) {
  // If status is provided, map it to variant and color
  // Otherwise use the variant and color props directly (for backward compatibility)
  if (status) {
    const variantMap: Record<string, "primary" | "secondary" | "tertiary" | "soft"> = {
      default: "soft",
      primary: "primary",
      secondary: "secondary",
      success: "soft",
      danger: "soft",
      accent: "soft",
      warning: "soft",
    };

    const colorMap: Record<string, string | undefined> = {
      default: undefined,
      primary: "primary",
      secondary: "secondary",
      success: "success",
      danger: "danger",
      accent: "accent",
      warning: "warning",
    };

    return (
      <HeroUIChip
        variant={variantMap[status]}
        color={colorMap[status] as any}
        {...props}
      >
        {children}
      </HeroUIChip>
    );
  }

  // Pass through variant and color props directly
  const resolvedVariant = variant === "flat" ? "soft" : variant;
  let resolvedColor: BaseChipProps["color"] | undefined;

  if (color) {
    resolvedColor = isExtendedColor(color) ? EXTENDED_COLOR_MAP[color] : color;
  }

  return (
    <HeroUIChip variant={resolvedVariant} color={resolvedColor} {...props}>
      {children}
    </HeroUIChip>
  );
}
