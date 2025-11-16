"use client";

import { Switch as HeroUISwitch } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

/**
 * HeroUI Switch 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/switch
 *
 * 开关控件,类似 Checkbox 但视觉上更明显
 */

export interface SwitchProps extends ComponentProps<typeof HeroUISwitch> {
  label?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export function Switch({ label, description, children, ...props }: SwitchProps) {
  const contentLabel = label ?? children;

  return (
    <HeroUISwitch {...props}>
      <HeroUISwitch.Control>
        <HeroUISwitch.Thumb />
      </HeroUISwitch.Control>
      {(contentLabel || description) && (
        <div className="ml-3 flex flex-col">
          {contentLabel && (
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {contentLabel}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
          )}
        </div>
      )}
    </HeroUISwitch>
  );
}
