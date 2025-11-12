#!/bin/bash

# Add Steam Credential via API
# This script uses the Next.js API to add Steam credential

echo "============================================================"
echo "🎮 通过 API 添加 Steam 凭据"
echo "============================================================"
echo ""

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$STEAM_API_KEY" ] || [ -z "$STEAM_USER_ID" ]; then
    echo "❌ 错误：Steam 凭据未在 .env 中配置"
    echo "   需要: STEAM_API_KEY 和 STEAM_USER_ID"
    exit 1
fi

echo "📝 准备添加 Steam 凭据..."
echo "   Steam API Key: ${STEAM_API_KEY:0:8}..."
echo "   Steam User ID: $STEAM_USER_ID"
echo ""

# Create credential JSON payload
CREDENTIAL_JSON=$(cat <<EOF
{
  "platform": "STEAM",
  "type": "API_KEY",
  "value": "$STEAM_API_KEY",
  "metadata": {
    "steamId": "$STEAM_USER_ID",
    "description": "Steam API credential for gaming data sync"
  },
  "isValid": true
}
EOF
)

echo "🚀 正在调用 API..."
echo ""

# Call the API endpoint
RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/credentials \
  -H "Content-Type: application/json" \
  -d "$CREDENTIAL_JSON")

echo "📋 API 响应:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract credential ID if successful
CREDENTIAL_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)

if [ ! -z "$CREDENTIAL_ID" ] && [ "$CREDENTIAL_ID" != "null" ]; then
    echo "✅ Steam 凭据创建成功！"
    echo "   凭据 ID: $CREDENTIAL_ID"
    echo ""
    echo "🎯 下一步："
    echo "   1. 访问: http://localhost:3000/admin/credentials"
    echo "   2. 找到 Steam 凭据并点击"同步"按钮"
    echo "   3. 或运行: curl -X POST http://localhost:3000/api/admin/credentials/$CREDENTIAL_ID/sync"
    echo ""
else
    echo "⚠️  创建失败或凭据可能已存在"
    echo "   请访问: http://localhost:3000/admin/credentials 查看现有凭据"
    echo ""
fi

echo "============================================================"
