"use client";

import { Button as HeroUIButton } from "@heroui/react";
import type { ButtonProps as HeroUIButtonProps } from "@heroui/react";

export interface ButtonProps extends Omit<HeroUIButtonProps, "onPress"> {
  onClick?: () => void;
}

/**
 * HeroUI Button 组件封装
 * 提供与现有代码库兼容的 onClick 接口
 */
export function Button({ onClick, ...props }: ButtonProps) {
  return <HeroUIButton onPress={onClick} {...props} />;
}
