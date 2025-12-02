"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MomentImage } from "@/lib/moments";

interface LightboxContextValue {
  // Image lightbox
  openLightbox: (images: MomentImage[], initialIndex?: number) => void;
  closeLightbox: () => void;

  // Text lightbox
  openTextLightbox: (text: string) => void;
  closeTextLightbox: () => void;

  // State
  isOpen: boolean;
  images: MomentImage[];
  currentIndex: number;
  textContent: string | null;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

interface LightboxProviderProps {
  children: ReactNode;
}

/**
 * Lightbox Context Provider
 *
 * 提供类型安全的 lightbox 控制 API，替代全局自定义事件
 */
export function LightboxProvider({ children }: LightboxProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<MomentImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);

  const openLightbox = useCallback((newImages: MomentImage[], initialIndex = 0) => {
    if (newImages && newImages.length > 0) {
      setImages(newImages);
      setCurrentIndex(Math.min(initialIndex, newImages.length - 1));
      setTextContent(null);
      setIsOpen(true);
    }
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openTextLightbox = useCallback((text: string) => {
    if (text) {
      setTextContent(text);
      setImages([]);
      setIsOpen(true);
    }
  }, []);

  const closeTextLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: LightboxContextValue = {
    openLightbox,
    closeLightbox,
    openTextLightbox,
    closeTextLightbox,
    isOpen,
    images,
    currentIndex,
    textContent,
  };

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>;
}

/**
 * Hook to access lightbox controls
 *
 * @example
 * const { openLightbox } = useLightbox();
 * <div onClick={() => openLightbox(images, 0)}>Open</div>
 */
export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return context;
}
