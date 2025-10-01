#!/bin/sh
set -e

# 确保 uploads 目录存在并设置正确权限
mkdir -p /app/public/uploads
chown -R node:node /app/public/uploads

# Generate Prisma Client and run migrations if schema exists
if [ -f /app/prisma/schema.prisma ]; then
  echo "Generating Prisma Client..."
  npx prisma generate
  echo "Running database migrations..."
  npm run db:migrate
fi

# 使用 su-exec 切换到 node 用户执行后续命令
exec su-exec node "$@"
