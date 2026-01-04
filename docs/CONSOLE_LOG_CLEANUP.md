# 生产环境 Console 日志清理方案

## 📊 清理结果

- **清理前**: 519 个 console 语句
- **清理后**: 仅保留 364 个 `console.error` 和 `console.warn`（用于错误监控）
- **已移除**: 154 个调试日志（console.log/debug/info/trace/table）
- **修改文件**: 42 个

## 🎯 清理策略

### ✅ 保留的日志类型
- `console.error` - 错误日志，用于生产环境监控
- `console.warn` - 警告日志，用于潜在问题提示

### ❌ 已移除的日志类型
- `console.log` - 调试日志
- `console.debug` - 调试日志
- `console.info` - 信息日志
- `console.trace` - 堆栈跟踪
- `console.table` - 表格输出

## 🔧 使用工具

### 1. 自动清理脚本

```bash
# 预览将要移除的 console 语句
node scripts/remove-console-logs.js --dry-run

# 执行清理
node scripts/remove-console-logs.js

# 清理特定目录
node scripts/remove-console-logs.js src/app
```

### 2. ESLint 规则保护

已配置 ESLint 规则，在开发时自动检测新增的 console 语句：

```javascript
// eslint.config.mjs
"no-console": ["error", { allow: ["error", "warn"] }]
```

运行检查：
```bash
pnpm run lint        # 检查代码规范
pnpm run lint:fix    # 自动修复部分问题
```

## 📝 开发建议

### ✅ 正确做法

```typescript
// ✅ 错误处理 - 可以使用
console.error("API request failed:", error);
console.warn("Deprecated feature usage detected");

// ✅ 开发调试 - 使用开发工具
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data); // 仅开发环境
}

// ✅ 更好的调试方式
import { logger } from '@/lib/logger';
logger.debug('Debug info:', data);  // 使用专业日志库
```

### ❌ 错误做法

```typescript
// ❌ 直接使用 console.log - 会在生产环境暴露
console.log("User data:", userData);

// ❌ 调试信息泄露敏感数据
console.log("Database config:", dbConfig);

// ❌ 性能日志应使用专业工具
console.log("API response time:", Date.now() - start);
```

## 🚀 部署前检查清单

- [ ] 运行 `node scripts/remove-console-logs.js --dry-run` 检查
- [ ] 运行 `pnpm run lint` 确保无新增 console
- [ ] 运行 `pnpm run type-check` 验证类型安全
- [ ] 检查敏感信息是否已移除
- [ ] 确认错误监控日志（error/warn）正常工作

## 🔒 安全提醒

生产环境 console 日志可能暴露：
- 用户敏感数据（邮箱、ID、token）
- API 密钥和配置信息
- 内部业务逻辑
- 系统架构细节

**生产域名**: dybzy.com
**环境判断**: `process.env.NODE_ENV === 'production'`

## 📈 后续优化建议

1. **引入专业日志库**
   - 考虑使用 `pino` 或 `winston`
   - 支持日志分级和环境判断
   - 可集成日志收集服务

2. **环境变量控制**
   ```typescript
   // lib/logger.ts
   const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

   export const logger = {
     debug: DEBUG ? console.log : () => {},
     error: console.error,
     warn: console.warn,
   };
   ```

3. **CI/CD 集成**
   - 在部署流程中自动运行清理脚本
   - 添加 pre-commit hook 防止提交 console.log

## 📚 相关文件

- `scripts/remove-console-logs.js` - 清理脚本
- `eslint.config.mjs` - ESLint 配置
- `.husky/pre-commit` - Git commit 钩子（可选）
