#!/bin/bash

# 检查并清理孤儿 Vitest 进程
# 用法: ./scripts/check-orphans.sh [--auto]

set -e

echo "🔍 检查孤儿 Vitest 进程..."

# 查找所有 vitest 进程
orphan_count=$(pgrep -fl vitest 2>/dev/null | wc -l | tr -d ' ')

if [ "$orphan_count" -eq 0 ]; then
  echo "✅ 未发现孤儿进程"
  exit 0
fi

echo "⚠️  发现 $orphan_count 个 Vitest 进程:"
echo ""
pgrep -fl vitest

# 显示内存占用
echo ""
echo "📊 内存占用情况:"
ps -o pid,ppid,rss,comm -p $(pgrep vitest | tr '\n' ',' | sed 's/,$//') 2>/dev/null | awk '
  NR==1 {print $0; next}
  {total+=$3; print $0}
  END {printf "\n总内存: %.2f GB\n", total/1024/1024}
'

# 自动模式或询问用户
if [ "$1" = "--auto" ]; then
  echo ""
  echo "🧹 自动清理模式，正在清理..."
  pkill -9 -f 'node.*vitest'
  echo "✅ 清理完成"
else
  echo ""
  read -p "是否清理这些进程？(y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    pkill -9 -f 'node.*vitest'
    echo "✅ 已清理所有孤儿进程"
  else
    echo "❌ 已取消清理"
  fi
fi
