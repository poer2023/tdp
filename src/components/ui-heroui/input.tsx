"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  inputClassName?: string;
  id?: string;
}

/**
 * Input 组件 - 使用 Tailwind 样式
 * 暂时不使用 HeroUI Input，因为 beta 版本 API 不稳定
 */
export function Input({
  label,
  description,
  error,
  errorMessage,
  className,
  inputClassName,
  isRequired,
  isDisabled,
  isInvalid,
  id,
  name,
  ...props
}: InputProps) {
  // errorMessage 是 error 的别名,优先使用 error
  // isInvalid 用于控制错误状态显示
  const displayError = error || errorMessage;
  const invalid = isInvalid ?? Boolean(displayError);

  // 生成唯一 ID: 优先使用传入的 id，其次使用 name，最后生成随机 ID
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 11)}`;

  const inputClass = cn(
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400",
    invalid && "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500",
    inputClassName
  );

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {description && !displayError && (
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <input
        id={inputId}
        name={name}
        required={isRequired}
        disabled={isDisabled}
        aria-invalid={invalid || undefined}
        className={inputClass}
        {...props}
      />
      {displayError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{displayError}</p>}
    </div>
  );
}
