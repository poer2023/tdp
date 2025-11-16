"use client";

import { Card as HeroUICard } from "@heroui/react";
import type { CardProps as HeroUICardProps } from "@heroui/react";

export interface CardProps extends HeroUICardProps {
  children: React.ReactNode;
}

/**
 * HeroUI Card 组件封装
 * 提供统一的卡片容器组件
 */
export function Card({ children, ...props }: CardProps) {
  return <HeroUICard {...props}>{children}</HeroUICard>;
}

// 导出子组件以支持 CardHeader, CardContent 等用法
const CardHeader = HeroUICard.Header;
const CardTitle = HeroUICard.Title;
const CardDescription = HeroUICard.Description;
const CardContent = HeroUICard.Content;
const CardFooter = HeroUICard.Footer;

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
