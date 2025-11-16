"use client";

import { cn } from "@/lib/utils";
import { useId, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  id?: string;
}

/**
 * Textarea 组件 - 使用 Tailwind 样式
 * 暂时不使用 HeroUI TextArea，因为 beta 版本 API 不稳定
 */
export function Textarea({
  label,
  description,
  error,
  errorMessage,
  className,
  isRequired,
  isDisabled,
  isInvalid,
  id,
  name,
  ...props
}: TextareaProps) {
  // errorMessage 是 error 的别名,优先使用 error
  const displayError = error || errorMessage;
  const invalid = isInvalid ?? Boolean(displayError);

  // 生成唯一 ID: 优先使用传入的 id，其次使用 name，最后使用 React 的 useId hook
  const reactId = useId();
  const textareaId = id || name || reactId;

  const textareaClass = cn(
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400",
    invalid && "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
  );

  return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {description && !displayError && (
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <textarea
        id={textareaId}
        name={name}
        required={isRequired}
        disabled={isDisabled}
        aria-invalid={invalid || undefined}
        className={textareaClass}
        {...props}
      />
      {displayError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{displayError}</p>}
    </div>
  );
}
