import React from "react";
import Link from "next/link";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
    primary: "admin-primary-btn",
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

type LuminaInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  inputClassName?: string;
};

export const LuminaInput = React.forwardRef<HTMLInputElement, LuminaInputProps>(
  function LuminaInput(
    { label, description, error, hint, className, inputClassName, ...inputProps },
    ref
  ) {
    const id = inputProps.id;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label
            htmlFor={id}
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
          >
            <span>{label}</span>
            {hint && (
              <span className="text-[11px] font-medium text-sage-600 dark:text-sage-300">
                {hint}
              </span>
            )}
          </label>
        )}
        {description && (
          <p className="text-xs text-stone-500/90 dark:text-stone-400">{description}</p>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50",
            error && "border-red-300 focus:border-red-400 focus:ring-red-300/30 dark:border-red-800",
            inputClassName
          )}
          {...inputProps}
        />
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

type LuminaTextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  textareaClassName?: string;
};

export const LuminaTextArea = React.forwardRef<HTMLTextAreaElement, LuminaTextAreaProps>(
  function LuminaTextArea(
    { label, description, error, hint, className, textareaClassName, ...textareaProps },
    ref
  ) {
    const id = textareaProps.id;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label
            htmlFor={id}
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
          >
            <span>{label}</span>
            {hint && (
              <span className="text-[11px] font-medium text-sage-600 dark:text-sage-300">
                {hint}
              </span>
            )}
          </label>
        )}
        {description && (
          <p className="text-xs text-stone-500/90 dark:text-stone-400">{description}</p>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50",
            error && "border-red-300 focus:border-red-400 focus:ring-red-300/30 dark:border-red-800",
            textareaClassName
          )}
          {...textareaProps}
        />
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

type LuminaEditFormProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function LuminaEditForm({
  title,
  description,
  children,
  footer,
  className,
}: LuminaEditFormProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6 space-y-2">
          {title && (
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {footer && (
        <div className="mt-6 border-t border-stone-200 pt-4 dark:border-stone-800">{footer}</div>
      )}
    </div>
  );
}

type LuminaDataSectionProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function LuminaDataSection({
  title,
  description,
  action,
  children,
  className,
}: LuminaDataSectionProps) {
  return (
    <section
      className={cn(
        "animate-in fade-in rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type LuminaImageUploadAreaProps = {
  label?: string;
  description?: string;
  hint?: string;
  onFilesSelected?: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function LuminaImageUploadArea({
  label,
  description,
  hint,
  onFilesSelected,
  accept = "image/*",
  multiple = true,
  children,
  footer,
  className,
}: LuminaImageUploadAreaProps) {
  const inputId = React.useId();

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (onFilesSelected) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      className={cn(
        "animate-in fade-in space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900",
        className
      )}
    >
      {(label || description) && (
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {label && (
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {label}
              </p>
            )}
            {description && (
              <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
            )}
          </div>
          {hint && (
            <span className="text-[11px] font-medium text-sage-600 dark:text-sage-300">
              {hint}
            </span>
          )}
        </div>
      )}

      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center transition hover:border-sage-400 hover:bg-sage-50/80 dark:border-stone-700 dark:bg-stone-900/60 dark:hover:border-sage-700 dark:hover:bg-stone-900"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-200 transition group-hover:ring-sage-300 dark:bg-stone-900 dark:ring-stone-700 dark:group-hover:ring-sage-600">
          <svg
            className="h-5 w-5 text-sage-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-800 group-hover:text-sage-700 dark:text-stone-100 dark:group-hover:text-sage-300">
            拖拽或点击上传图片
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            支持 JPG、PNG、WebP 等格式，建议单张不超过 5MB
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => onFilesSelected?.(event.target.files)}
        />
      </label>

      {children && <div className="grid gap-3 md:grid-cols-2">{children}</div>}
      {footer && (
        <div className="text-xs text-stone-500 dark:text-stone-400">{footer}</div>
      )}
    </div>
  );
}

type LuminaRichPostItemProps = {
  title: string;
  excerpt?: string;
  coverUrl?: string;
  status?: React.ReactNode;
  tags?: string[];
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
};

export function LuminaRichPostItem({
  title,
  excerpt,
  coverUrl,
  status,
  tags = [],
  stats,
  actions,
  footer,
  href,
}: LuminaRichPostItemProps) {
  const content = (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100 sm:h-32 sm:w-48 dark:border-stone-800 dark:bg-stone-800/60">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
            No cover
          </div>
        )}
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {title}
            </h3>
            {excerpt && (
              <p className="text-sm text-stone-500 dark:text-stone-400">{excerpt}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {status}
        </div>
        {stats && <div className="text-xs text-stone-500 dark:text-stone-400">{stats}</div>}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        {footer && (
          <div className="text-xs text-stone-500 dark:text-stone-400">{footer}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
      {href ? <Link href={href}>{content}</Link> : content}
    </div>
  );
}

type LuminaRichMomentItemProps = {
  content: string;
  images?: string[];
  visibility?: string;
  location?: string;
  tags?: string[];
  timestamp?: string;
  actions?: React.ReactNode;
};

export function LuminaRichMomentItem({
  content,
  images = [],
  visibility,
  location,
  tags = [],
  timestamp,
  actions,
}: LuminaRichMomentItemProps) {
  return (
    <div className="animate-in fade-in space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-stone-800 dark:text-stone-50">{content}</p>
          <div className="flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
            {visibility && (
              <span className="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800">
                {visibility}
              </span>
            )}
            {location && (
              <span className="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800">
                {location}
              </span>
            )}
            {timestamp && <span>{timestamp}</span>}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sage-50 px-2 py-1 text-xs font-medium text-sage-700 dark:bg-sage-900/30 dark:text-sage-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      {images.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {images.map((img) => (
            <div
              key={img}
              className="relative h-40 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type LuminaStatCardProps = {
  label: string;
  value: string | number;
  deltaLabel?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  helper?: string;
};

export function LuminaStatCard({
  label,
  value,
  deltaLabel,
  positive,
  icon,
  helper,
}: LuminaStatCardProps) {
  return (
    <div className="animate-in fade-in rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {label}
          </p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {value}
          </p>
          {helper && (
            <p className="text-xs text-stone-500 dark:text-stone-400">{helper}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-50 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300">
            {icon}
          </div>
        )}
      </div>
      {deltaLabel && (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            positive === undefined
              ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
              : positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}
        >
          {positive !== undefined && (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              {positive ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7 7 7M12 3v18"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7-7-7M12 21V3"
                />
              )}
            </svg>
          )}
          {deltaLabel}
        </p>
      )}
    </div>
  );
}

type LuminaChartCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function LuminaChartCard({
  title,
  description,
  action,
  children,
  footer,
}: LuminaChartCardProps) {
  return (
    <div className="animate-in fade-in space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {title}
          </p>
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div>{children}</div>
      {footer && (
        <div className="border-t border-stone-200 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          {footer}
        </div>
      )}
    </div>
  );
}
