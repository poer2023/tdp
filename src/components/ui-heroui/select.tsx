"use client";

import { Children, isValidElement, useId, type ReactNode } from "react";

export interface SelectItemProps {
  id: string;
  children: ReactNode;
}

export interface SelectProps {
  label?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  value?: string;
  defaultSelectedKeys?: string[];
  onChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

/**
 * Select Item 组件
 */
export function SelectItem({ children }: SelectItemProps) {
  return <>{children}</>;
}

/**
 * Select 组件 - 使用原生 select 样式
 * 暂时不使用 HeroUI Select，因为 beta 版本 API 不稳定
 */
export function Select({
  label,
  name,
  id,
  placeholder = "选择一项",
  isRequired,
  isDisabled,
  value,
  defaultSelectedKeys,
  onChange,
  children,
  className,
}: SelectProps) {
  const childArray = Children.toArray(children).filter((child): child is React.ReactElement<SelectItemProps> =>
    isValidElement(child)
  );
  // defaultSelectedKeys[0] 用作 defaultValue
  const defaultValue = defaultSelectedKeys?.[0];

  // 生成唯一 ID: 优先使用传入的 id，其次使用 name，最后使用 React 的 useId hook
  const reactId = useId();
  const selectId = id || name || reactId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        required={isRequired}
        disabled={isDisabled}
        className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {childArray.map((child) => (
          <option key={child.props.id} value={child.props.id}>
            {child.props.children}
          </option>
        ))}
      </select>
    </div>
  );
}

// 导出 SelectItem 作为 Select.Item
Select.Item = SelectItem;
