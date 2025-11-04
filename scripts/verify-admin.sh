#!/bin/bash

# 管理员账号验证脚本
#
# 功能：
# 1. 检查 ADMIN_EMAILS 环境变量是否已设置
# 2. 验证数据库中管理员用户的角色和邮箱验证状态
# 3. 显示管理员账号列表和状态
#
# 使用场景：
# - 部署后验证管理员配置是否正确
# - 排查管理员访问问题
# - 定期审计管理员账号状态

set -e

echo "======================================"
echo "📋 管理员账号状态验证"
echo "======================================"
echo ""

# 1. 检查 ADMIN_EMAILS 环境变量
echo "🔍 检查环境变量..."
if [ -z "$ADMIN_EMAILS" ]; then
    echo "❌ 错误：ADMIN_EMAILS 环境变量未设置"
    echo "   请在 .env 文件中设置：ADMIN_EMAILS=your-email@example.com"
    exit 1
fi

echo "✅ ADMIN_EMAILS 已设置："
echo "   $ADMIN_EMAILS"
echo ""

# 2. 检查数据库连接
echo "🔍 检查数据库连接..."
if command -v docker &> /dev/null && docker compose ps | grep -q postgres; then
    PSQL_CMD="docker compose exec -T postgres psql -U xin -d tdp"
    echo "✅ 使用 Docker Compose 连接数据库"
elif command -v psql &> /dev/null; then
    PSQL_CMD="psql"
    echo "✅ 使用本地 psql 连接数据库"
else
    echo "❌ 错误：无法找到 psql 或 Docker"
    exit 1
fi
echo ""

# 3. 查询管理员用户状态
echo "📊 查询管理员用户状态..."
echo ""

# 将逗号分隔的邮箱转换为 SQL IN 语法
IFS=',' read -ra EMAILS <<< "$ADMIN_EMAILS"
SQL_EMAILS=""
for email in "${EMAILS[@]}"; do
    # 去除空格并转小写
    email=$(echo "$email" | tr -d ' ' | tr '[:upper:]' '[:lower:]')
    if [ -z "$SQL_EMAILS" ]; then
        SQL_EMAILS="'$email'"
    else
        SQL_EMAILS="$SQL_EMAILS,'$email'"
    fi
done

# 执行 SQL 查询
QUERY="
SELECT
    email AS \"邮箱\",
    role AS \"角色\",
    CASE
        WHEN \"emailVerified\" IS NOT NULL THEN '✅ 已验证'
        ELSE '❌ 未验证'
    END AS \"邮箱验证\",
    \"createdAt\" AS \"创建时间\",
    \"updatedAt\" AS \"更新时间\"
FROM \"User\"
WHERE LOWER(email) IN ($SQL_EMAILS)
ORDER BY email;
"

$PSQL_CMD -c "$QUERY"
echo ""

# 4. 统计管理员数量
echo "📈 统计信息..."
ADMIN_COUNT_QUERY="
SELECT
    COUNT(*) AS count
FROM \"User\"
WHERE LOWER(email) IN ($SQL_EMAILS) AND role = 'ADMIN';
"

ADMIN_COUNT=$($PSQL_CMD -t -c "$ADMIN_COUNT_QUERY" | tr -d ' ')

echo "   - 配置的管理员邮箱数：${#EMAILS[@]}"
echo "   - 数据库中 ADMIN 角色用户数：$ADMIN_COUNT"
echo ""

# 5. 检查是否有遗漏的管理员
if [ "$ADMIN_COUNT" -lt "${#EMAILS[@]}" ]; then
    echo "⚠️  警告：部分管理员邮箱未找到或角色不正确"
    echo "   可能的原因："
    echo "   1. 用户尚未注册登录"
    echo "   2. 用户角色未正确设置"
    echo ""
    echo "   解决方案："
    echo "   - 确保管理员用户已至少登录一次"
    echo "   - 运行修复脚本：npm run fix:admin"
elif [ "$ADMIN_COUNT" -eq 0 ]; then
    echo "❌ 错误：没有找到任何 ADMIN 角色用户"
    echo "   请运行修复脚本：npm run fix:admin"
    exit 1
else
    echo "✅ 所有管理员账号配置正确"
fi

echo ""
echo "======================================"
echo "✅ 验证完成"
echo "======================================"
