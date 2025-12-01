import React from "react";
import Link from "next/link";

// ListItem - 列表行设计组件
interface LuminaListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  href?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export function LuminaListItem({
  title,
  subtitle,
  icon,
  href,
  actions,
  onClick,
  badge,
  children,
}: LuminaListItemProps) {
  const content = (
    <>
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-bold text-stone-800 dark:text-stone-100">
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </>
  );

  const className =
    "flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-colors dark:border-stone-800 dark:bg-stone-900";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:border-stone-300 hover:bg-stone-50 dark:hover:border-stone-700 dark:hover:bg-stone-800`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`${className} w-full text-left`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

// ListContainer - 单列列表容器
interface LuminaListContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function LuminaListContainer({
  children,
  className = "",
}: LuminaListContainerProps) {
  return <div className={`grid gap-3 ${className}`}>{children}</div>;
}

// SectionContainer - 区块容器
interface LuminaSectionContainerProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LuminaSectionContainer({
  title,
  action,
  children,
  className = "",
}: LuminaSectionContainerProps) {
  return (
    <div className={`${className}`}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ActionButton - 主操作按钮
interface LuminaActionBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function LuminaActionBtn({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: LuminaActionBtnProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors rounded-lg";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const variantStyles = {
    primary:
      "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200",
    secondary:
      "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
    danger:
      "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </button>
  );
}

// IconButton - 图标按钮（用于列表项操作）
interface LuminaIconBtnProps {
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function LuminaIconBtn({
  icon,
  onClick,
  href,
  variant = "default",
  title,
  className = "",
  disabled = false,
}: LuminaIconBtnProps) {
  const baseStyles =
    "p-2 rounded-lg transition-colors inline-flex items-center justify-center";

  const variantStyles = {
    default:
      "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200",
    danger:
      "text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName} title={title}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      title={title}
    >
      {icon}
    </button>
  );
}

// Badge - 状态标签
interface LuminaBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function LuminaBadge({
  children,
  variant = "default",
}: LuminaBadgeProps) {
  const variantStyles = {
    default: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

// EmptyState - 空状态
interface LuminaEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function LuminaEmptyState({
  icon,
  title,
  description,
  action,
}: LuminaEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
      {icon && (
        <div className="mb-4 text-stone-400 dark:text-stone-500">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
