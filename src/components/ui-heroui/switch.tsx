"use client";

import { Switch as HeroUISwitch, Label, Description } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Switch 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/switch
 *
 * 开关控件,类似 Checkbox 但视觉上更明显
 */

export interface SwitchProps extends Omit<ComponentProps<typeof HeroUISwitch>, "children"> {
  label?: string;
  description?: string;
}

export function Switch({
  label,
  description,
  ...props
}: SwitchProps) {
  return (
    <HeroUISwitch {...props}>
      <HeroUISwitch.Control>
        <HeroUISwitch.Thumb />
      </HeroUISwitch.Control>
      {(label || description) && (
        <HeroUISwitch.Content>
          {label && <Label>{label}</Label>}
          {description && <Description>{description}</Description>}
        </HeroUISwitch.Content>
      )}
    </HeroUISwitch>
  );
}

export type { ComponentProps as SwitchProps } from "@heroui/react";
