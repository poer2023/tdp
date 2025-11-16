"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
} from "@/components/ui-heroui";

export default function HeroUITestPage() {
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("");

  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-8 text-2xl font-bold">HeroUI v3 测试页面</h1>

      <div className="space-y-8">
        {/* Button 测试 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">Button 组件测试</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" onPress={() => alert("Primary clicked!")}>
              Primary Button
            </Button>
            <Button variant="secondary" onPress={() => alert("Secondary clicked!")}>
              Secondary Button
            </Button>
            <Button variant="ghost" onPress={() => alert("Ghost clicked!")}>
              Ghost Button
            </Button>
            <Button variant="danger" onPress={() => alert("Danger clicked!")}>
              Danger Button
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Button variant="primary" isDisabled>
              Disabled Button
            </Button>
            <Button variant="secondary" isDisabled>
              Secondary Disabled
            </Button>
          </div>
        </section>

        {/* Card 测试 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Card 组件测试</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card variant="default">
              <CardHeader>
                <CardTitle>默认卡片</CardTitle>
                <CardDescription>这是一个默认样式的卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  卡片内容区域，可以放置任何内容
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">
                  操作按钮
                </Button>
              </CardFooter>
            </Card>

            <Card variant="secondary">
              <CardHeader>
                <CardTitle>次要卡片</CardTitle>
                <CardDescription>variant=&quot;secondary&quot;</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  次要样式的卡片
                </p>
              </CardContent>
            </Card>

            <Card variant="tertiary">
              <CardHeader>
                <CardTitle>三级卡片</CardTitle>
                <CardDescription>variant=&quot;tertiary&quot;</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  三级样式的卡片
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input 测试 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">Input 组件测试</h2>
          <div className="space-y-4">
            <Input
              label="基础输入框"
              placeholder="请输入内容"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <Input label="必填输入框" placeholder="必填字段" isRequired />

            <Input label="禁用输入框" placeholder="已禁用" isDisabled defaultValue="不可编辑" />

            <Input label="错误状态" placeholder="输入内容" error="这是一个错误提示" />

            <Input type="email" label="邮箱地址" placeholder="example@email.com" />

            <Input type="password" label="密码" placeholder="请输入密码" />
          </div>
        </section>

        {/* Select 测试 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">Select 组件测试</h2>
          <div className="space-y-4">
            <Select
              label="选择平台"
              placeholder="请选择一个平台"
              value={selectValue}
              onChange={(key) => setSelectValue(String(key))}
            >
              <Select.Item id="github">GitHub</Select.Item>
              <Select.Item id="bilibili">Bilibili</Select.Item>
              <Select.Item id="steam">Steam</Select.Item>
              <Select.Item id="twitter">Twitter</Select.Item>
            </Select>

            <Select label="必选项" placeholder="必须选择" isRequired>
              <Select.Item id="option1">选项 1</Select.Item>
              <Select.Item id="option2">选项 2</Select.Item>
            </Select>

            <Select label="禁用选择器" placeholder="已禁用" isDisabled>
              <Select.Item id="disabled">不可选</Select.Item>
            </Select>
          </div>
        </section>

        {/* 深色模式测试说明 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">测试说明</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>点击按钮测试 onPress 事件处理（HeroUI 官方 API）</li>
            <li>测试不同的按钮变体（primary, secondary, ghost, danger）</li>
            <li>测试不同的尺寸（sm, md, lg）</li>
            <li>测试禁用和加载状态</li>
            <li>测试 Card 组件的不同变体（default, secondary, tertiary）</li>
            <li>测试 Input 组件的各种状态（必填、禁用、错误）</li>
            <li>测试 Select 组件的选项和状态</li>
            <li>切换深色模式查看样式适配</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
