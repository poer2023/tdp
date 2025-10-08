#!/bin/sh
set -e

# 确保 uploads 目录存在并设置正确权限
mkdir -p /app/public/uploads

# 直接执行传入的命令（已通过 USER node 切换用户）
exec "$@"
