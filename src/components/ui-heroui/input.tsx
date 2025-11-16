"use client";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
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
  isRequired,
  isDisabled,
  isInvalid,
  ...props
}: InputProps) {
  // errorMessage 是 error 的别名,优先使用 error
  // isInvalid 用于控制错误状态显示
  const displayError = error || errorMessage;

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {description && !displayError && (
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <input
        required={isRequired}
        disabled={isDisabled}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
        {...props}
      />
      {displayError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{displayError}</p>}
    </div>
  );
}
