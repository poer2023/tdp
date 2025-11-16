"use client";

import { tv, type VariantProps } from "tailwind-variants";
import type { ComponentProps } from "react";

/**
 * HeroUI Table 组件 - 自定义实现
 *
 * 注意: HeroUI v3 beta.1 还没有官方 Table 组件
 * 这是基于 HeroUI 样式系统的自定义实现
 */

const tableVariants = tv({
  slots: {
    wrapper: "w-full overflow-auto",
    table: "w-full border-collapse",
    thead: "border-b border-zinc-200 dark:border-zinc-800",
    tbody: "",
    tfoot: "border-t border-zinc-200 dark:border-zinc-800",
    tr: "border-b border-zinc-200 last:border-0 dark:border-zinc-800",
    th: "px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100",
    td: "px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400",
  },
  variants: {
    variant: {
      default: {},
      striped: {
        tbody: "[&>tr:nth-child(even)]:bg-zinc-50 dark:[&>tr:nth-child(even)]:bg-zinc-900/50",
      },
    },
    hoverable: {
      true: {
        tr: "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    hoverable: false,
  },
});

type TableVariants = VariantProps<typeof tableVariants>;

export interface TableProps extends ComponentProps<"table">, TableVariants {}

export function Table({ className, variant, hoverable, ...props }: TableProps) {
  const { wrapper, table } = tableVariants({ variant, hoverable });

  return (
    <div className={wrapper()}>
      <table className={table({ className })} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<"thead">) {
  const { thead } = tableVariants();
  return <thead className={thead({ className })} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  const { tbody } = tableVariants();
  return <tbody className={tbody({ className })} {...props} />;
}

export function TableFoot({ className, ...props }: ComponentProps<"tfoot">) {
  const { tfoot } = tableVariants();
  return <tfoot className={tfoot({ className })} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  const { tr } = tableVariants();
  return <tr className={tr({ className })} {...props} />;
}

export function TableHeader({ className, ...props }: ComponentProps<"th">) {
  const { th } = tableVariants();
  return <th className={th({ className })} {...props} />;
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  const { td } = tableVariants();
  return <td className={td({ className })} {...props} />;
}

// 组合导出
Table.Head = TableHead;
Table.Body = TableBody;
Table.Foot = TableFoot;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;
