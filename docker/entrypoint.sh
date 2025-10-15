#!/bin/sh
set -e

echo "==> 检查上传目录..."
# 确保上传目录存在
mkdir -p /app/public/uploads/gallery /app/public/uploads/covers 2>/dev/null || true

# 测试写入权限
if touch /app/public/uploads/.permission-test 2>/dev/null; then
    rm -f /app/public/uploads/.permission-test
    echo "✅ 上传目录权限正常"
else
    echo "⚠️  警告: 上传目录权限不足"
    echo "当前用户: $(id -un) (uid=$(id -u))"
    echo "目录权限:"
    ls -la /app/public/uploads/ 2>/dev/null || echo "无法读取目录"
    echo ""
    echo "提示: 如果是首次部署，请检查 init-volumes 容器是否成功运行"
fi

# 执行主命令
exec "$@"
