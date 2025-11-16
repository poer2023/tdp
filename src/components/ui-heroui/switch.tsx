"use client";

import { Switch as HeroUISwitch } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Switch 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/switch
 *
 * 开关控件,类似 Checkbox 但视觉上更明显
 */

export interface SwitchProps extends ComponentProps<typeof HeroUISwitch> {
  // Add any custom props here if needed
}

export function Switch(props: SwitchProps) {
  return (
    <HeroUISwitch {...props}>
      <HeroUISwitch.Control>
        <HeroUISwitch.Thumb />
      </HeroUISwitch.Control>
    </HeroUISwitch>
  );
}
