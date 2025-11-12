import { cn } from "@/lib/utils";

type ContainerWidth = "narrow" | "reading" | "standard" | "wide" | "dashboard";

interface ContainerProps {
  /**
   * 容器宽度预设
   * - narrow: max-w-2xl (672px) - 适合社交媒体式内容
   * - reading: max-w-3xl (768px) - 适合长文阅读
   * - standard: max-w-4xl (896px) - 通用内容页面
   * - wide: max-w-6xl (1152px) - 多栏布局
   * - dashboard: max-w-7xl (1280px) - 数据密集页面
   */
  width?: ContainerWidth;
  /**
   * 自定义 padding 类名 (覆盖默认值)
   */
  padding?: string;
  /**
   * 禁用 padding (仅保留宽度和居中)
   */
  noPadding?: boolean;
  /**
   * 额外的类名
   */
  className?: string;
  /**
   * 子元素
   */
  children: React.ReactNode;
}

const widthClasses: Record<ContainerWidth, string> = {
  narrow: "max-w-2xl",
  reading: "max-w-3xl",
  standard: "max-w-4xl",
  wide: "max-w-6xl",
  dashboard: "max-w-7xl",
};

/**
 * 统一的页面容器组件
 * 提供一致的宽度、居中和间距管理
 */
export function Container({
  width = "standard",
  padding,
  noPadding = false,
  className,
  children,
}: ContainerProps) {
  // 默认 padding: 移动端 px-4 py-8, 平板 px-6 py-10, 桌面 py-12
  const defaultPadding = "px-4 py-8 sm:px-6 sm:py-10 md:py-12";

  return (
    <div
      className={cn(
        "mx-auto",
        widthClasses[width],
        noPadding ? "" : padding || defaultPadding,
        className
      )}
    >
      {children}
    </div>
  );
}
