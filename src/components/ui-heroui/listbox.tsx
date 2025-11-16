"use client";

import { ListBox as HeroUIListBox, ListBoxItem } from "@heroui/react";
import type { ComponentProps } from "react";

type BaseListBoxProps = ComponentProps<typeof HeroUIListBox>;

export interface ListBoxProps extends Omit<BaseListBoxProps, "variant"> {
  variant?: BaseListBoxProps["variant"] | "flat";
}

export function ListBox({ variant, ...props }: ListBoxProps) {
  const resolvedVariant = variant === "flat" ? "default" : variant;
  return <HeroUIListBox variant={resolvedVariant} {...props} />;
}

export { ListBoxItem };
