"use client";

import { Alert as HeroUIAlert, CloseButton } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

/**
 * HeroUI Alert 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/alert
 *
 * 支持 5 种状态: default, accent, success, warning, danger
 */

export interface AlertProps extends Omit<ComponentProps<typeof HeroUIAlert>, "color"> {
  status?: "default" | "accent" | "success" | "warning" | "danger";
  title?: string;
  description?: string;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  color?: ComponentProps<typeof HeroUIAlert>["color"];
}

export function Alert({
  title,
  description,
  icon,
  closable,
  onClose,
  children,
  status,
  color,
  ...props
}: AlertProps) {
  const resolvedColor = status ?? color;

  return (
    <HeroUIAlert color={resolvedColor} {...props}>
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
