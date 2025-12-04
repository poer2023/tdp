import React from "react";
import Link from "next/link";
import { X, UploadCloud } from "lucide-react";
import { AdminImage } from "./AdminImage";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// NavBtn - 侧边栏导航按钮
// ============================================================================
interface LuminaNavBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  href?: string;
}

export function LuminaNavBtn({ active, onClick, icon, label, href }: LuminaNavBtnProps) {
  const className = cn(
    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
    active
      ? "bg-sage-600 text-white"
      : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {icon} <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {icon} <span>{label}</span>
    </button>
  );
}

// ============================================================================
// SectionContainer - 区块容器（Lumina 风格）
// ============================================================================
interface LuminaSectionContainerProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function LuminaSectionContainer({
  title,
  onAdd,
  addLabel = "Add New",
  children,
  className = "",
}: LuminaSectionContainerProps) {
  return (
    <div className={cn("max-w-5xl mx-auto animate-in fade-in duration-500 pb-10", className)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{title}</h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 font-medium text-sm transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// EditForm - 编辑表单模态框
// ============================================================================
interface LuminaEditFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function LuminaEditForm({
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
  footer,
  className,
}: LuminaEditFormProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800",
        className
      )}
    >
      <div className="flex justify-between items-center mb-6 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h3>
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{description}</p>
          )}
        </div>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-4">{children}</div>
      {footer || (
        <div className="flex gap-3 pt-6 mt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onSave}
            className="flex-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2.5 rounded-lg font-bold hover:opacity-90"
          >
            {saveLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            {cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Input - 文本输入组件
// ============================================================================
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
    return (
      <div className={cn("", className)}>
        {label && (
          <label className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            <span>{label}</span>
            {hint && (
              <span className="text-[11px] font-medium text-sage-600 dark:text-sage-300">
                {hint}
              </span>
            )}
          </label>
        )}
        {description && (
          <p className="text-xs text-stone-500/90 dark:text-stone-400 mb-2">{description}</p>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm",
            error && "border-red-300 focus:border-red-400 focus:ring-red-300/30 dark:border-red-800",
            inputClassName
          )}
          {...inputProps}
        />
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

// ============================================================================
// TextArea - 多行文本组件
// ============================================================================
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
    return (
      <div className={cn("", className)}>
        {label && (
          <label className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            <span>{label}</span>
            {hint && (
              <span className="text-[11px] font-medium text-sage-600 dark:text-sage-300">
                {hint}
              </span>
            )}
          </label>
        )}
        {description && (
          <p className="text-xs text-stone-500/90 dark:text-stone-400 mb-2">{description}</p>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full p-3 border rounded-lg h-32 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-sm resize-none",
            error && "border-red-300 focus:border-red-400 focus:ring-red-300/30 dark:border-red-800",
            textareaClassName
          )}
          {...textareaProps}
        />
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

// ============================================================================
// Select - 下拉选择组件
// ============================================================================
type LuminaSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  selectClassName?: string;
};

export const LuminaSelect = React.forwardRef<HTMLSelectElement, LuminaSelectProps>(
  function LuminaSelect(
    { label, description, error, options, className, selectClassName, ...selectProps },
    ref
  ) {
    return (
      <div className={cn("", className)}>
        {label && (
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-stone-500/90 dark:text-stone-400 mb-2">{description}</p>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100",
            error && "border-red-300 dark:border-red-800",
            selectClassName
          )}
          {...selectProps}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

// ============================================================================
// ActionBtn - 操作按钮
// ============================================================================
interface LuminaActionBtnProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
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
  icon,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: LuminaActionBtnProps) {
  // 如果只有 icon 没有 children，则是图标按钮
  if (icon && !children) {
    const iconBtnClass = cn(
      "p-2 rounded-lg transition-colors",
      variant === "danger"
        ? "text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        : "text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    return (
      <button onClick={onClick} disabled={disabled} className={iconBtnClass}>
        {icon}
      </button>
    );
  }

  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
  };

  const variantStyles = {
    primary: "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90",
    secondary:
      "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    disabledStyles,
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClassName}>
      {icon}
      {children}
    </button>
  );
}

// ============================================================================
// IconBtn - 图标按钮（用于列表项操作）
// ============================================================================
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
  const baseStyles = "p-2 rounded-lg transition-colors inline-flex items-center justify-center";

  const variantStyles = {
    default:
      "text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800",
    danger:
      "text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName = cn(baseStyles, variantStyles[variant], disabledStyles, className);

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName} title={title}>
        {icon}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={combinedClassName} title={title}>
      {icon}
    </button>
  );
}

// ============================================================================
// ListContainer - 列表容器
// ============================================================================
interface LuminaListContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function LuminaListContainer({ children, className = "" }: LuminaListContainerProps) {
  return <div className={cn("grid gap-3", className)}>{children}</div>;
}

// ============================================================================
// ListItem - 列表项组件
// ============================================================================
interface LuminaListItemProps {
  title: string;
  subtitle?: string;
  image?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function LuminaListItem({
  title,
  subtitle,
  image,
  icon,
  badge,
  onEdit,
  onDelete,
  actions,
  href,
  onClick,
  children,
}: LuminaListItemProps) {
  const content = (
    <>
      {image && (
        <AdminImage src={image} alt="" fill={false} width={40} height={40} className="rounded object-cover" />
      )}
      {icon && !image && (
        <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{subtitle}</p>
        )}
        {children}
      </div>
      {actions || (
        <div className="flex gap-2">
          {onEdit && <LuminaIconBtn icon={<EditIcon />} onClick={onEdit} />}
          {onDelete && <LuminaIconBtn icon={<TrashIcon />} onClick={onDelete} variant="danger" />}
        </div>
      )}
    </>
  );

  const className =
    "bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-4 transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:border-stone-300 dark:hover:border-stone-600`}
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

// ============================================================================
// Badge - 状态标签
// ============================================================================
interface LuminaBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function LuminaBadge({ children, variant = "default" }: LuminaBadgeProps) {
  const variantStyles = {
    default: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    error: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    info: "bg-sage-50 text-sage-600 dark:bg-sage-900/20 dark:text-sage-400",
  };

  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}

// ============================================================================
// EmptyState - 空状态
// ============================================================================
interface LuminaEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function LuminaEmptyState({ icon, title, description, action }: LuminaEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
      {icon && <div className="mb-4 text-stone-400 dark:text-stone-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================================
// DataSection - 数据区块
// ============================================================================
type LuminaDataSectionProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function LuminaDataSection({
  title,
  description,
  icon,
  action,
  children,
  className,
}: LuminaDataSectionProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-bold text-lg flex items-center gap-2 text-stone-800 dark:text-stone-200">
            {icon} {title}
          </h3>
          {action}
        </div>
      )}
      {description && (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// ImageUploadArea - 图片上传区域
// ============================================================================
type LuminaImageUploadAreaProps = {
  queue: Array<{ file: File; preview: string }>;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  multiple: boolean;
  currentImageUrl?: string;
  existingImages?: string[];
  onRemoveExisting?: (idx: number) => void;
  manualUrl?: string;
  setManualUrl?: (v: string) => void;
};

export function LuminaImageUploadArea({
  queue,
  onDrop,
  onFileSelect,
  onRemove,
  isDragOver,
  setIsDragOver,
  multiple,
  currentImageUrl,
  existingImages,
  onRemoveExisting,
  manualUrl = "",
  setManualUrl,
}: LuminaImageUploadAreaProps) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 transition-colors cursor-pointer relative min-h-[160px]",
          isDragOver
            ? "border-sage-500 bg-sage-50 dark:bg-sage-900/20"
            : "border-stone-300 dark:border-stone-700 hover:border-sage-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          multiple={multiple}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          onChange={onFileSelect}
          accept="image/*"
        />

        {queue.length === 0 &&
        !currentImageUrl &&
        (!existingImages || existingImages.length === 0) ? (
          <>
            <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-500 mb-3 pointer-events-none">
              <UploadCloud size={20} />
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 pointer-events-none">
              {multiple ? "拖拽多张图片" : "拖拽封面图片"}
            </p>
            <p className="text-xs text-stone-400 mt-1 pointer-events-none">
              支持 JPG、PNG、WebP 格式
            </p>
          </>
        ) : (
          <div className="text-sm text-stone-400">{multiple ? "拖拽添加更多" : "拖拽替换"}</div>
        )}
      </div>

      {setManualUrl && (
        <>
          <div className="flex gap-2 items-center">
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase">或</span>
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
          </div>
          <LuminaInput
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="输入图片 URL..."
          />
        </>
      )}

      <div className={cn("grid gap-2", multiple ? "grid-cols-4" : "grid-cols-2")}>
        {currentImageUrl && queue.length === 0 && (
          <div className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <AdminImage src={currentImageUrl} alt="当前封面" className="w-full h-full" containerClassName="w-full h-full" />
            <div className="absolute inset-0 bg-black/40 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              当前封面
            </div>
          </div>
        )}

        {existingImages &&
          existingImages.map((src, idx) => (
            <div
              key={`exist-${idx}`}
              className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              <AdminImage src={src} alt="已保存图片" className="w-full h-full" containerClassName="w-full h-full" />
              {onRemoveExisting && (
                <button
                  onClick={() => onRemoveExisting(idx)}
                  className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <X size={12} />
                </button>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 truncate text-center">
                已保存
              </div>
            </div>
          ))}

        {queue.map((item, idx) => (
          <div
            key={`queue-${idx}`}
            className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-sage-500 shadow-md"
          >
            <AdminImage src={item.preview} alt="待上传图片" className="w-full h-full" containerClassName="w-full h-full" />
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-sage-600 text-white text-[9px] p-1 truncate text-center">
              待上传
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RichPostItem - 文章卡片
// ============================================================================
type LuminaRichPostItemProps = {
  title: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  date?: string;
  likes?: number;
  comments?: number;
  tags?: string[];
  onEdit: () => void;
  onDelete: () => void;
};

export function LuminaRichPostItem({
  title,
  excerpt,
  imageUrl,
  category,
  date,
  likes = 0,
  comments = 0,
  tags = [],
  onEdit,
  onDelete,
}: LuminaRichPostItemProps) {
  return (
    <div className="group bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex gap-4 transition-all hover:border-stone-300 dark:hover:border-stone-600">
      <div className="w-24 h-24 flex-shrink-0 bg-stone-200 dark:bg-stone-800 rounded-lg overflow-hidden relative">
        {imageUrl ? (
          <AdminImage src={imageUrl} alt={title || ''} className="w-full h-full" containerClassName="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <FileIcon size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-600 bg-sage-50 dark:text-sage-400 dark:bg-sage-900/30 px-2 py-0.5 rounded-full">
                {category}
              </span>
            )}
            {date && (
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <CalendarIcon size={10} /> {date}
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 truncate">
            {title}
          </h3>
          {excerpt && (
            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
              {excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-400 mt-2">
          <div className="flex items-center gap-1">
            <HeartIcon size={12} /> {likes}
          </div>
          <div className="flex items-center gap-1">
            <MessageIcon size={12} /> {comments}
          </div>
          {tags.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <TagIcon size={12} /> {tags[0]} {tags.length > 1 && `+${tags.length - 1}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 border-l border-stone-100 dark:border-stone-800 pl-4 ml-2">
        <LuminaActionBtn icon={<EditIcon size={16} />} onClick={onEdit} />
        <LuminaActionBtn icon={<TrashIcon size={16} />} onClick={onDelete} variant="danger" />
      </div>
    </div>
  );
}

// ============================================================================
// RichMomentItem - 动态卡片
// ============================================================================
type LuminaRichMomentItemProps = {
  content: string;
  images?: string[];
  tags?: string[];
  date?: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function LuminaRichMomentItem({
  content,
  images = [],
  tags = [],
  date,
  onEdit,
  onDelete,
}: LuminaRichMomentItemProps) {
  return (
    <div className="group bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 transition-all hover:border-stone-300 dark:hover:border-stone-600">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {date && <div className="text-xs font-bold text-stone-400">{date}</div>}
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <LuminaActionBtn icon={<EditIcon size={14} />} onClick={onEdit} />
          <LuminaActionBtn icon={<TrashIcon size={14} />} onClick={onDelete} variant="danger" />
        </div>
      </div>
      <p className="text-stone-800 dark:text-stone-200 text-sm mb-3 line-clamp-3 font-serif">
        {content}
      </p>
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <div
              key={idx}
              className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-700"
            >
              <AdminImage src={src} alt="" className="w-full h-full" containerClassName="w-full h-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// StatCard - 统计卡片
// ============================================================================
type LuminaStatCardProps = {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  iconColor?: string;
};

export function LuminaStatCard({
  label,
  value,
  change,
  icon,
  iconColor = "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
}: LuminaStatCardProps) {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        {icon && <div className={cn("p-3 rounded-lg", iconColor)}>{icon}</div>}
        {change && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              isPositive && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20",
              isNegative && "bg-rose-50 text-rose-600 dark:bg-rose-900/20",
              !isPositive && !isNegative && "bg-stone-100 text-stone-600 dark:bg-stone-800"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</h3>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mt-1">{label}</p>
    </div>
  );
}

// ============================================================================
// ChartCard - 图表卡片
// ============================================================================
type LuminaChartCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function LuminaChartCard({
  title,
  description,
  icon,
  action,
  children,
  footer,
  className,
}: LuminaChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
          {icon} {title}
        </h3>
        {action}
      </div>
      {description && (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{description}</p>
      )}
      {children}
      {footer && (
        <div className="border-t border-stone-200 pt-3 mt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Checkbox - 复选框组件
// ============================================================================
interface LuminaCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function LuminaCheckbox({
  checked,
  onChange,
  label,
  className = "",
  disabled = false,
}: LuminaCheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 accent-sage-600"
      />
      {label && (
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
      )}
    </label>
  );
}

// ============================================================================
// 内部使用的简单图标
// ============================================================================
function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function FileIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}

function CalendarIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function HeartIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MessageIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TagIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
