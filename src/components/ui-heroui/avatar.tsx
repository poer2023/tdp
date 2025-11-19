"use client";

import { Avatar as HeroUIAvatar } from "@heroui/react";
import type { AvatarProps as HeroUIAvatarProps } from "@heroui/react";
import type { ReactNode } from "react";

export interface AvatarProps extends Omit<HeroUIAvatarProps, "children"> {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
  children?: ReactNode;
}

export function Avatar({ src, alt, children, fallback, ...props }: AvatarProps) {
  return (
    <HeroUIAvatar {...props}>
      {src && <HeroUIAvatar.Image src={src} alt={alt} />}
      {(children || fallback) && (
        <HeroUIAvatar.Fallback>{children ?? fallback}</HeroUIAvatar.Fallback>
      )}
    </HeroUIAvatar>
  );
}
