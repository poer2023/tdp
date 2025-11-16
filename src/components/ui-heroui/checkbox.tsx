"use client";

import { Checkbox as HeroUICheckbox, Label, Description } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Checkbox 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/checkbox
 *
 * 使用 React Aria 规范:
 * - onChange 接收 boolean 参数
 * - isSelected 控制选中状态
 */

export interface CheckboxProps extends Omit<ComponentProps<typeof HeroUICheckbox>, "children"> {
  label?: string;
  description?: string;
  error?: string;
}

export function Checkbox({
  label,
  description,
  error,
  isInvalid,
  ...props
}: CheckboxProps) {
  return (
    <HeroUICheckbox isInvalid={isInvalid || !!error} {...props}>
      <HeroUICheckbox.Control>
        <HeroUICheckbox.Indicator />
      </HeroUICheckbox.Control>
      {(label || description || error) && (
        <HeroUICheckbox.Content>
          {label && <Label>{label}</Label>}
          {description && !error && <Description>{description}</Description>}
          {error && (
            <Description className="text-danger-500">{error}</Description>
          )}
        </HeroUICheckbox.Content>
      )}
    </HeroUICheckbox>
  );
}

// CheckboxGroup 直接导出
export { CheckboxGroup } from "@heroui/react";
export type { CheckboxProps as HeroUICheckboxProps } from "@heroui/react";
