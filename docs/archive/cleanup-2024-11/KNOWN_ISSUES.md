# 已知问题 | Known Issues

**最后更新**: 2025-10-10
**状态**: 🔴 需要修复 | Needs Fixing

---

## 📋 概述 | Overview

本文档记录了当前代码库中已知的测试失败和需要修复的问题。这些问题不影响主要功能运行，但需要在后续开发中解决。

**当前测试状态**:

- ✅ 通过: 334/422 测试 (79%)
- ❌ 失败: 88/422 测试 (21%)
- 📁 失败文件: 7 个

**影响范围**:

- 🟡 不影响生产功能正常运行
- 🔴 影响 CI/CD 质量门禁（目标通过率 ≥95%）
- 🟢 所有集成测试和 E2E 测试正常通过

---

## 🐛 详细问题列表 | Detailed Issue List

### 1. SearchCommand 组件测试失败 (14/28 失败)

**文件**: `src/components/search/__tests__/search-command.test.tsx`

**失败测试数**: 14 个
**通过测试数**: 14 个
**失败率**: 50%

**典型错误**:

```typescript
// 错误 1: document.activeElement 断言失败
expect(document.activeElement).toBe(input);
// 原因: Command Palette 组件的焦点管理在测试环境中与实际环境不一致

// 错误 2: DOM 结构快照不匹配
// 原因: 组件渲染时包含额外的 wrapper 元素和导航提示
```

**影响功能**: 搜索 Command Palette UI

**优先级**: P1 (高)

**建议修复方案**:

1. 检查 `cmdk` 库在测试环境中的焦点行为
2. 使用 `waitFor` 等待焦点状态稳定
3. 更新快照或调整测试断言以适应实际 DOM 结构
4. 考虑使用 `userEvent` 替代 `fireEvent` 以更真实地模拟用户交互

**相关代码位置**:

- 组件: `src/components/search/search-command.tsx`
- 测试: `src/components/search/__tests__/search-command.test.tsx:528`

---

### 2. PhotoMetadataPanel 组件测试失败 (31/34 失败)

**文件**: `src/components/__tests__/photo-metadata-panel.test.tsx`

**失败测试数**: 31 个
**通过测试数**: 3 个
**失败率**: 91%

**典型错误**:

```typescript
// 错误: screen.getByText() 无法找到元素
// 原因: 组件渲染逻辑变更，元素结构或文本内容改变
```

**影响功能**: 照片元数据面板显示

**优先级**: P1 (高)

**建议修复方案**:

1. 更新测试用例以匹配最新的组件实现
2. 检查 EXIF 数据提取逻辑在测试环境中的模拟
3. 验证组件 props 传递是否正确

**相关代码位置**:

- 组件: `src/components/photo-metadata-panel.tsx`
- 测试: `src/components/__tests__/photo-metadata-panel.test.tsx`

---

### 3. PhotoViewer 组件测试失败 (18/28 失败)

**文件**: `src/components/__tests__/photo-viewer.test.tsx`

**失败测试数**: 18 个
**通过测试数**: 10 个
**失败率**: 64%

**典型错误**:

```typescript
// 错误: 组件交互断言失败
// 原因: 照片查看器的状态管理或事件处理在测试中未正确模拟
```

**影响功能**: 照片查看器 UI 和交互

**优先级**: P1 (高)

**建议修复方案**:

1. Mock PhotoSwipe 或相关图片查看库的行为
2. 验证组件状态更新逻辑
3. 检查事件监听器的绑定和触发

**相关代码位置**:

- 组件: `src/components/photo-viewer.tsx`
- 测试: `src/components/__tests__/photo-viewer.test.tsx`

---

### 4. LivePhotoPlayer 组件测试失败 (13/16 失败)

**文件**: `src/components/__tests__/live-photo-player.test.tsx`

**失败测试数**: 13 个
**通过测试数**: 3 个
**失败率**: 81%

**典型错误**:

```typescript
// 错误: 视频播放相关断言失败
// 原因: HTMLVideoElement 在测试环境中的行为与浏览器不一致
```

**影响功能**: Live Photo 播放功能

**优先级**: P2 (中)

**建议修复方案**:

1. Mock HTMLVideoElement 的 play/pause 方法
2. 使用 fake timers 控制动画和播放时间
3. 简化测试用例，聚焦核心交互逻辑

**相关代码位置**:

- 组件: `src/components/live-photo-player.tsx`
- 测试: `src/components/__tests__/live-photo-player.test.tsx`

---

### 5. AuthHeader 组件测试失败 (6/20 失败)

**文件**: `src/components/__tests__/auth-header.test.tsx`

**失败测试数**: 6 个
**通过测试数**: 14 个
**失败率**: 30%

**典型错误**:

```typescript
// 错误 1: Loading skeleton 未正确渲染
// 错误 2: 菜单交互失败
// 原因: NextAuth session 状态的 mock 不完整
```

**影响功能**: 用户认证头部和菜单

**优先级**: P2 (中)

**建议修复方案**:

1. 完善 `next-auth/react` 的 mock 实现
2. 确保 `useSession` 返回正确的 loading 状态
3. 验证菜单展开/收起的状态管理

**相关代码位置**:

- 组件: `src/components/auth-header.tsx`
- 测试: `src/components/__tests__/auth-header.test.tsx`

---

### 6. LanguageSwitcher 组件测试失败 (4/10 失败)

**文件**: `src/components/__tests__/language-switcher.test.tsx`

**失败测试数**: 4 个
**通过测试数**: 6 个
**失败率**: 40%

**典型错误**:

```typescript
// 错误: 语言切换路由断言失败
// 原因: next-intl 路由在测试环境中的行为与预期不符
```

**影响功能**: 语言切换功能

**优先级**: P2 (中)

**建议修复方案**:

1. Mock `next-intl` 的 `usePathname` 和 `useRouter`
2. 验证语言切换时的路由跳转逻辑
3. 检查 locale 参数的传递

**相关代码位置**:

- 组件: `src/components/language-switcher.tsx`
- 测试: `src/components/__tests__/language-switcher.test.tsx`

---

### 7. GalleryCard 组件测试失败 (2/25 失败)

**文件**: `src/components/__tests__/gallery-card.test.tsx`

**失败测试数**: 2 个
**通过测试数**: 23 个
**失败率**: 8%

**典型错误**:

```typescript
// 错误: Live Photo 标识未正确渲染
// 原因: 条件渲染逻辑或 props 传递问题
```

**影响功能**: 图库卡片展示

**优先级**: P3 (低)

**建议修复方案**:

1. 检查 Live Photo 判断逻辑
2. 验证图标组件的渲染条件
3. 更新测试断言以匹配实际渲染结果

**相关代码位置**:

- 组件: `src/components/gallery-card.tsx`
- 测试: `src/components/__tests__/gallery-card.test.tsx`

---

## 📊 统计分析 | Statistics

### 按组件分类

| 组件               | 失败数 | 总数 | 失败率 | 优先级 |
| ------------------ | ------ | ---- | ------ | ------ |
| PhotoMetadataPanel | 31     | 34   | 91%    | P1 🔴  |
| PhotoViewer        | 18     | 28   | 64%    | P1 🔴  |
| LivePhotoPlayer    | 13     | 16   | 81%    | P2 🟡  |
| SearchCommand      | 14     | 28   | 50%    | P1 🔴  |
| LanguageSwitcher   | 4      | 10   | 40%    | P2 🟡  |
| AuthHeader         | 6      | 20   | 30%    | P2 🟡  |
| GalleryCard        | 2      | 25   | 8%     | P3 🟢  |

### 按错误类型分类

| 错误类型         | 数量 | 占比 |
| ---------------- | ---- | ---- |
| DOM 断言失败     | ~40  | 45%  |
| 组件渲染问题     | ~25  | 28%  |
| Mock/Stub 不完整 | ~15  | 17%  |
| 异步操作处理     | ~8   | 9%   |

### 按优先级分类

- **P1 (高优先级)**: 63 个失败 (72%)
  - SearchCommand, PhotoMetadataPanel, PhotoViewer
- **P2 (中优先级)**: 23 个失败 (26%)
  - LivePhotoPlayer, AuthHeader, LanguageSwitcher
- **P3 (低优先级)**: 2 个失败 (2%)
  - GalleryCard

---

## 🎯 修复计划 | Fix Plan

### Phase 1: 高优先级修复 (建议 1-2 周)

**目标**: 修复 P1 问题，将通过率提升到 ≥90%

1. **Week 1**: SearchCommand + PhotoMetadataPanel
   - 预计修复: 45 个测试
   - 提升通过率: 79% → 89%

2. **Week 2**: PhotoViewer
   - 预计修复: 18 个测试
   - 提升通过率: 89% → 93%

### Phase 2: 中优先级修复 (建议 1 周)

**目标**: 修复 P2 问题，将通过率提升到 ≥95%

3. **Week 3**: LivePhotoPlayer + AuthHeader + LanguageSwitcher
   - 预计修复: 23 个测试
   - 提升通过率: 93% → 98%

### Phase 3: 低优先级修复 (可选)

**目标**: 达到 100% 通过率

4. **Week 4**: GalleryCard + 剩余边缘问题
   - 预计修复: 2 个测试
   - 提升通过率: 98% → 100%

---

## 🔧 通用修复指南 | General Fix Guidelines

### 1. DOM 断言失败

**常见原因**:

- 组件渲染结构变更
- 快照过时
- 选择器不准确

**修复步骤**:

```bash
# 1. 运行单个测试查看详细输出
npm run test:run -- <test-file-path>

# 2. 更新快照（如果结构变更是预期的）
npm run test:run -- <test-file-path> -u

# 3. 或调整测试断言以匹配新结构
```

### 2. Mock/Stub 不完整

**常见原因**:

- 第三方库未正确 mock
- 环境 API（如 IntersectionObserver）缺失

**修复步骤**:

```typescript
// 添加 global mock
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "loading" }),
}));

// 或在 vitest.config.ts 中添加全局 setup
setupFiles: ["./src/tests/setup.ts"];
```

### 3. 异步操作处理

**常见原因**:

- 未等待异步状态更新
- Fake timers 使用不当

**修复步骤**:

```typescript
// 使用 waitFor 等待异步更新
await waitFor(() => {
  expect(screen.getByText(/expected/)).toBeInTheDocument();
});

// 或正确使用 fake timers
vi.useFakeTimers();
// ... trigger action
await vi.runAllTimersAsync();
vi.useRealTimers();
```

---

## 📝 修复记录 | Fix Log

### 2025-10-10

- ❌ **识别问题**: 首次记录所有失败测试
- 📊 **统计分析**: 88 个失败测试，7 个失败文件
- 📋 **制定计划**: 3 阶段修复计划

### (待更新)

- (记录后续修复进展)

---

## 🤝 如何贡献修复 | How to Contribute Fixes

### 1. 选择一个问题

从上述列表中选择一个你想修复的测试文件。

### 2. 创建分支

```bash
git checkout -b fix/test-<component-name>
# 例如: git checkout -b fix/test-search-command
```

### 3. 本地运行测试

```bash
# 运行特定文件的测试
npm run test:run -- src/components/__tests__/<file-name>

# 监听模式（方便调试）
npm run test:watch -- src/components/__tests__/<file-name>
```

### 4. 修复并验证

- 修改测试代码或组件代码
- 确保所有测试通过
- 运行 lint 和类型检查: `npm run lint && npm run type-check`

### 5. 提交并创建 PR

```bash
git add .
git commit -m "fix: 修复 <Component> 组件的测试失败"
git push origin fix/test-<component-name>
```

然后在 GitHub 上创建 Pull Request，并在描述中引用本文档。

---

## 📚 相关文档 | Related Documents

- 测试策略: [README.md#测试策略](README.md#测试策略--testing-strategy)
- CI/CD 配置: [claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md](claudedocs/E2E_CICD_CONFIGURATION_GUIDE.md)
- 测试编写指南: [docs/TESTING.md](docs/TESTING.md)
- E2E 测试指南: [docs/E2E_TESTING_GUIDE.md](docs/E2E_TESTING_GUIDE.md)

---

## ⚠️ 免责声明 | Disclaimer

本文档记录的问题**不影响生产环境功能的正常运行**。所有失败的测试都是单元测试，主要涉及：

- ✅ 功能正常: 所有核心功能在实际使用中表现正常
- ✅ 集成测试通过: 27 个集成测试 100% 通过
- ✅ E2E 测试通过: 8 个关键 E2E 测试 100% 通过
- ⚠️ 单元测试失败: 部分组件的单元测试需要更新以匹配最新实现

这些测试失败是由于：

1. 组件实现更新后测试未同步更新
2. 测试环境配置需要改进
3. Mock/Stub 实现不完整

**修复这些测试的主要目的是**:

- 提高代码质量和可维护性
- 满足 CI/CD 质量门禁要求（≥95% 通过率）
- 为未来的重构提供安全网

---

**维护者**: @hao
**创建日期**: 2025-10-10
**最后更新**: 2025-10-10

_如有疑问或需要帮助，请在 GitHub Issues 中提出_
