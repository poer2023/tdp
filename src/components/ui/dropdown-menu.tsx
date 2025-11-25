"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

interface DropdownMenuProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  align?: "start" | "end";
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function DropdownMenu({ children, trigger, align = "end" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative z-10 inline-block" ref={dropdownRef}>
        {/* 触发按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-stone-300 dark:hover:bg-stone-800"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {trigger || <MoreVertical className="h-5 w-5" />}
        </button>

        {/* 下拉菜单内容 */}
        {isOpen && (
          <div
            className={cn(
              "absolute top-full z-[9999] mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-800 dark:bg-stone-900 dark:shadow-2xl dark:shadow-black/80",
              align === "end" ? "right-0" : "left-0"
            )}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  icon,
  destructive,
  className,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setIsOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          : "text-gray-700 hover:bg-gray-100 dark:text-stone-300 dark:hover:bg-stone-800",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-stone-200 dark:bg-stone-800" />;
}
