"use client";

import { Button as HeroUIButton } from "@heroui/react";
import type { ButtonProps as HeroUIButtonProps } from "@heroui/react";
import type { ReactNode } from "react";

type LegacyVariant = HeroUIButtonProps["variant"] | "solid" | "light" | "outline" | "destructive";
type LegacyColor = "primary" | "secondary" | "danger" | "success" | "accent";

export interface ButtonProps extends Omit<HeroUIButtonProps, "variant" | "size"> {
  variant?: LegacyVariant;
  color?: LegacyColor;
  size?: HeroUIButtonProps["size"] | "icon" | "default";
  disabled?: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  children?: ReactNode;
}

const COLOR_TO_VARIANT: Record<string, HeroUIButtonProps["variant"]> = {
  primary: "primary",
  secondary: "secondary",
  danger: "danger",
  success: "primary",
  accent: "primary",
};

function resolveVariant(
  variant: LegacyVariant | undefined,
  color: LegacyColor | undefined
): HeroUIButtonProps["variant"] | undefined {
  if (!variant) {
    return color ? COLOR_TO_VARIANT[color] ?? undefined : undefined;
  }

  if (variant === "solid") {
    return color ? COLOR_TO_VARIANT[color] ?? "primary" : "primary";
  }

  if (variant === "light") {
    if (color === "danger") return "danger-soft";
    return "ghost";
  }

  if (variant === "outline") {
    return color ? COLOR_TO_VARIANT[color] ?? "tertiary" : "tertiary";
  }

  if (variant === "ghost" && color === "danger") {
    return "danger-soft";
  }

  if (variant === "destructive") {
    return "danger";
  }

  return variant as HeroUIButtonProps["variant"];
}

export function Button({
  variant,
  color,
  size,
  isIconOnly,
  disabled,
  isDisabled,
  startContent,
  endContent,
  children,
  asChild,
  className,
  ...props
}: ButtonProps) {
  const resolvedVariant = resolveVariant(variant, color);
  const resolvedSize = size === "icon" ? "sm" : size === "default" ? "md" : size;
  const resolvedIsIconOnly = asChild ? false : isIconOnly ?? size === "icon";
  const resolvedDisabled = isDisabled ?? disabled;
  const shouldPassIsDisabled = !asChild;

  let content: ReactNode = children;
  if (!asChild) {
    content = resolvedIsIconOnly ? (
      children ?? startContent ?? endContent ?? null
    ) : (
      <span className="inline-flex items-center gap-2">
        {startContent}
        {children}
        {endContent}
      </span>
    );
  }

  const heroProps: HeroUIButtonProps = {
    variant: resolvedVariant,
    size: resolvedSize,
    isIconOnly: resolvedIsIconOnly,
    asChild,
    className,
    ...props,
  };

  if (shouldPassIsDisabled) {
    heroProps.isDisabled = resolvedDisabled;
  }

  return (
    <HeroUIButton
      {...heroProps}
      aria-disabled={!shouldPassIsDisabled && resolvedDisabled ? true : undefined}
    >
      {content}
    </HeroUIButton>
  );
}
