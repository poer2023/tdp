"use client";

import { Alert as HeroUIAlert, CloseButton } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Alert 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/alert
 *
 * 支持 5 种状态: default, accent, success, warning, danger
 */

export interface AlertProps extends ComponentProps<typeof HeroUIAlert> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export function Alert({
  title,
  description,
  icon,
  closable,
  onClose,
  children,
  ...props
}: AlertProps) {
  return (
    <HeroUIAlert {...props}>
      {icon && <HeroUIAlert.Indicator>{icon}</HeroUIAlert.Indicator>}
      <HeroUIAlert.Content>
        {title && <HeroUIAlert.Title>{title}</HeroUIAlert.Title>}
        {description && (
          <HeroUIAlert.Description>{description}</HeroUIAlert.Description>
        )}
        {children}
      </HeroUIAlert.Content>
      {closable && <CloseButton onPress={onClose} />}
    </HeroUIAlert>
  );
}

export type { ComponentProps as AlertPropsBase } from "@heroui/react";
