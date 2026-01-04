#!/usr/bin/env node

/**
 * 生产环境 Console 日志清理工具
 *
 * 功能：
 * 1. 移除生产环境的 console.log、console.debug、console.info
 * 2. 保留 console.error 和 console.warn（用于错误监控）
 * 3. 支持 dry-run 模式预览更改
 * 4. 生成清理报告
 *
 * 使用：
 * - 预览模式: node scripts/remove-console-logs.js --dry-run
 * - 执行清理: node scripts/remove-console-logs.js
 * - 仅处理特定目录: node scripts/remove-console-logs.js src/app
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 要清理的 console 方法
  removeTypes: ['log', 'debug', 'info', 'trace', 'table'],
  // 要保留的 console 方法（错误监控需要）
  keepTypes: ['error', 'warn'],
  // 要处理的文件扩展名
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // 排除的目录
  excludeDirs: ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'],
  // 排除的文件
  excludeFiles: ['vitest.config', 'playwright.config', 'next.config'],
};

// 统计信息
const stats = {
  filesScanned: 0,
  filesModified: 0,
  consolesRemoved: 0,
  details: [],
};

/**
 * 检查是否应该处理该文件
 */
function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  // 检查扩展名
  if (!CONFIG.extensions.includes(ext)) return false;

  // 检查排除的文件
  if (CONFIG.excludeFiles.some(excluded => fileName.includes(excluded))) return false;

  // 检查排除的目录
  if (CONFIG.excludeDirs.some(dir => filePath.includes(`/${dir}/`))) return false;

  return true;
}

/**
 * 移除指定类型的 console 语句
 */
function removeConsoleLogs(content, filePath) {
  let modified = content;
  let removedCount = 0;

  // 为每种要移除的 console 类型创建正则
  CONFIG.removeTypes.forEach(type => {
    // 匹配模式：
    // 1. console.log(...) 单行
    // 2. console.log(\n  ...\n) 多行
    // 3. 可选的分号
    const patterns = [
      // 单行 console.log(...)
      new RegExp(`^\\s*console\\.${type}\\([^;]*\\);?\\s*$`, 'gm'),
      // 多行 console.log(\n  ...\n)
      new RegExp(`^\\s*console\\.${type}\\([\\s\\S]*?\\);?\\s*$`, 'gm'),
    ];

    patterns.forEach(pattern => {
      const matches = modified.match(pattern);
      if (matches) {
        removedCount += matches.length;
        modified = modified.replace(pattern, '');
      }
    });
  });

  // 清理连续的空行（超过2个空行合并为2个）
  modified = modified.replace(/\n\s*\n\s*\n+/g, '\n\n');

  if (removedCount > 0) {
    stats.details.push({
      file: filePath,
      removed: removedCount,
    });
  }

  return { content: modified, removed: removedCount };
}

/**
 * 递归处理目录
 */
function processDirectory(dirPath, dryRun = false) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // 检查是否应该排除此目录
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        processDirectory(fullPath, dryRun);
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      stats.filesScanned++;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const { content: newContent, removed } = removeConsoleLogs(content, fullPath);

      if (removed > 0) {
        stats.filesModified++;
        stats.consolesRemoved += removed;

        if (!dryRun) {
          fs.writeFileSync(fullPath, newContent, 'utf-8');
          console.log(`✅ ${fullPath}: 移除了 ${removed} 个 console 语句`);
        } else {
          console.log(`🔍 ${fullPath}: 将移除 ${removed} 个 console 语句`);
        }
      }
    }
  });
}

/**
 * 打印统计报告
 */
function printReport(dryRun) {
  console.log('\n' + '='.repeat(60));
  console.log(dryRun ? '📋 预览报告' : '✨ 清理报告');
  console.log('='.repeat(60));
  console.log(`扫描文件数: ${stats.filesScanned}`);
  console.log(`${dryRun ? '将修改' : '已修改'}文件数: ${stats.filesModified}`);
  console.log(`${dryRun ? '将移除' : '已移除'} console 语句数: ${stats.consolesRemoved}`);

  if (stats.details.length > 0) {
    console.log('\n📝 详细信息:');
    stats.details
      .sort((a, b) => b.removed - a.removed)
      .slice(0, 20)
      .forEach(({ file, removed }) => {
        console.log(`  - ${file}: ${removed} 个`);
      });

    if (stats.details.length > 20) {
      console.log(`  ... 还有 ${stats.details.length - 20} 个文件`);
    }
  }

  console.log('\n💡 提示:');
  console.log(`  - 保留的 console 类型: ${CONFIG.keepTypes.join(', ')}`);
  console.log(`  - 移除的 console 类型: ${CONFIG.removeTypes.join(', ')}`);

  if (dryRun) {
    console.log('\n⚠️  这是预览模式，没有修改任何文件');
    console.log('   要执行清理，请运行: node scripts/remove-console-logs.js');
  } else {
    console.log('\n✅ 清理完成！建议执行以下命令检查代码:');
    console.log('   pnpm run lint');
    console.log('   pnpm run type-check');
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetDir = args.find(arg => !arg.startsWith('--')) || 'src';

  const projectRoot = path.resolve(__dirname, '..');
  const targetPath = path.resolve(projectRoot, targetDir);

  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 错误: 目录不存在 ${targetPath}`);
    process.exit(1);
  }

  console.log('\n🚀 开始清理生产环境 console 日志...');
  console.log(`   目标目录: ${targetPath}`);
  console.log(`   模式: ${dryRun ? '预览模式 (--dry-run)' : '执行模式'}\n`);

  processDirectory(targetPath, dryRun);
  printReport(dryRun);
}

// 运行
main();
