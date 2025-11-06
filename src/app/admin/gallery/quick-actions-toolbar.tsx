"use client";

import * as React from "react";
import { Trash2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuickActionsToolbarProps {
  onApplyBulk: () => void;
  onClearAll: () => void;
  disabled?: boolean;
  imageCount: number;
}

/**
 * 快捷操作工具栏
 * - 应用批量设置: 将批量编辑的设置应用到所有单独编辑的图片
 * - 清除所有: 重置所有单独编辑的元数据
 */
export function QuickActionsToolbar({
  onApplyBulk,
  onClearAll,
  disabled = false,
  imageCount,
}: QuickActionsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* 左侧: 提示信息 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">快捷操作</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">共 {imageCount} 张图片</span>
      </div>

      {/* 右侧: 操作按钮 */}
      <div className="flex flex-wrap gap-2">
        {/* 应用批量设置 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Download className="mr-1 h-3 w-3" />
              应用批量设置
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>应用批量设置到所有图片?</AlertDialogTitle>
              <AlertDialogDescription>
                这将使用&quot;批量设置&quot;标签页中的标题、描述、分类和文章ID,
                覆盖所有图片当前的单独编辑内容。
                <br />
                <br />
                <strong>此操作不可撤销。</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={onApplyBulk}>确认应用</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 清除所有 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Trash2 className="mr-1 h-3 w-3" />
              清除所有
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>清除所有单独设置?</AlertDialogTitle>
              <AlertDialogDescription>
                这将清空所有图片的标题、描述,并将分类重置为&quot;原创&quot;, 清除所有文章关联。
                <br />
                <br />
                <strong>此操作不可撤销。</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认清除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
