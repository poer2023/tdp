"use client";

import { TextArea as HeroUITextArea } from "@heroui/react";
import { TextField } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Textarea 组件封装
 *
 * 官方文档: https://v3.heroui.com/docs/components/textarea
 *
 * 使用 TextField + TextArea 组合提供完整的表单功能
 * 包括 label, description, error 提示
 */

export interface TextareaProps extends ComponentProps<typeof HeroUITextArea> {
  label?: string;
  description?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export function Textarea({
  label,
  description,
  error,
  isRequired,
  className,
  ...props
}: TextareaProps) {
  // 如果有 label/description/error，使用 TextField 包裹
  if (label || description || error) {
    return (
      <TextField
        className={className}
        isRequired={isRequired}
        isInvalid={!!error}
      >
        {label && <TextField.Label>{label}</TextField.Label>}
        {description && !error && (
          <TextField.Description>{description}</TextField.Description>
        )}
        <HeroUITextArea {...props} />
        {error && <TextField.ErrorMessage>{error}</TextField.ErrorMessage>}
      </TextField>
    );
  }

  // 否则直接使用原生 TextArea
  return <HeroUITextArea className={className} {...props} />;
}

export type { ComponentProps as TextareaProps } from "@heroui/react";
