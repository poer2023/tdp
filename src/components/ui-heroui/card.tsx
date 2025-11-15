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

// 导出子组件以支持 Card.Header, Card.Content 等用法
Card.Header = HeroUICard.Header;
Card.Title = HeroUICard.Title;
Card.Description = HeroUICard.Description;
Card.Content = HeroUICard.Content;
Card.Footer = HeroUICard.Footer;
