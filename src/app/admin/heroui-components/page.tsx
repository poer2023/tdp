"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Checkbox,
  Switch,
  Alert,
  Chip,
  Badge,
  Tabs,
  Accordion,
  Tooltip,
  Skeleton,
  Spinner,
  Avatar,
  Table,
  Surface,
  Separator,
} from "@/components/ui-heroui";

export default function HeroUIComponentsShowcase() {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [checkboxSelected, setCheckboxSelected] = useState(false);
  const [switchSelected, setSwitchSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header>
        <h1 className="text-3xl font-bold">HeroUI v3 组件展示</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Phase 1 完成 - 18 个组件封装展示
        </p>
      </header>

      {/* Alert 组件 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Alert 组件</h2>
        <div className="space-y-3">
          <Alert status="default" title="默认提示" description="这是一个默认状态的提示" />
          <Alert status="accent" title="重要信息" description="这是一个重要信息提示" />
          <Alert
            status="success"
            title="操作成功"
            description="您的更改已成功保存"
            closable
            onClose={() => console.log("Alert closed")}
          />
          <Alert status="warning" title="警告" description="请注意此操作可能影响数据" />
          <Alert status="danger" title="错误" description="操作失败,请重试" />
        </div>
      </section>

      {/* 表单组件 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">表单组件</h2>
        <Card variant="secondary" className="p-6">
          <div className="space-y-4">
            <Input
              label="用户名"
              placeholder="请输入用户名"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              isRequired
            />

            <Textarea
              label="描述"
              placeholder="请输入描述"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
              description="最多 500 字符"
            />

            <Select
              label="选择平台"
              placeholder="请选择"
              value={selectValue}
              onChange={(key) => setSelectValue(String(key))}
            >
              <Select.Item id="github">GitHub</Select.Item>
              <Select.Item id="bilibili">Bilibili</Select.Item>
              <Select.Item id="steam">Steam</Select.Item>
            </Select>

            <Checkbox
              label="同意服务条款"
              description="请阅读并同意我们的服务条款"
              isSelected={checkboxSelected}
              onChange={setCheckboxSelected}
            />

            <Switch
              label="启用自动同步"
              description="自动同步您的数据"
              isSelected={switchSelected}
              onChange={setSwitchSelected}
            />
          </div>
        </Card>
      </section>

      {/* 数据展示 - Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Table 组件</h2>
        <Card variant="secondary">
          <Table variant="striped" hoverable>
            <Table.Head>
              <Table.Row>
                <Table.Header>ID</Table.Header>
                <Table.Header>名称</Table.Header>
                <Table.Header>状态</Table.Header>
                <Table.Header>操作</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              <Table.Row>
                <Table.Cell>1</Table.Cell>
                <Table.Cell>示例项目</Table.Cell>
                <Table.Cell>
                  <Chip status="success">已发布</Chip>
                </Table.Cell>
                <Table.Cell>
                  <Button variant="ghost" size="sm" onPress={() => console.log("Edit")}>
                    编辑
                  </Button>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>2</Table.Cell>
                <Table.Cell>测试项目</Table.Cell>
                <Table.Cell>
                  <Chip status="warning">草稿</Chip>
                </Table.Cell>
                <Table.Cell>
                  <Button variant="ghost" size="sm" onPress={() => console.log("Edit")}>
                    编辑
                  </Button>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>3</Table.Cell>
                <Table.Cell>已归档项目</Table.Cell>
                <Table.Cell>
                  <Chip status="default">已归档</Chip>
                </Table.Cell>
                <Table.Cell>
                  <Button variant="ghost" size="sm" onPress={() => console.log("Edit")}>
                    编辑
                  </Button>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Card>
      </section>

      {/* Chip/Badge 组件 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Chip/Badge 组件</h2>
        <div className="flex flex-wrap gap-2">
          <Chip status="default">默认</Chip>
          <Chip status="primary">主要</Chip>
          <Chip status="success">成功</Chip>
          <Chip status="warning">警告</Chip>
          <Chip status="danger">危险</Chip>
          <Badge status="accent">重要</Badge>
        </div>
      </section>

      {/* Tabs 组件 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs 组件</h2>
        <Tabs>
          <Tabs.List>
            <Tabs.Tab id="tab1">选项卡 1</Tabs.Tab>
            <Tabs.Tab id="tab2">选项卡 2</Tabs.Tab>
            <Tabs.Tab id="tab3">选项卡 3</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="tab1">
            <Card variant="secondary" className="p-6">
              <p>选项卡 1 的内容</p>
            </Card>
          </Tabs.Panel>
          <Tabs.Panel id="tab2">
            <Card variant="secondary" className="p-6">
              <p>选项卡 2 的内容</p>
            </Card>
          </Tabs.Panel>
          <Tabs.Panel id="tab3">
            <Card variant="secondary" className="p-6">
              <p>选项卡 3 的内容</p>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </section>

      {/* Accordion 组件 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Accordion 组件</h2>
        <Accordion>
          <Accordion.Item value="item1">
            <Accordion.Trigger>什么是 HeroUI?</Accordion.Trigger>
            <Accordion.Content>
              HeroUI 是一个现代化的 React UI 组件库,基于 React Aria 和 Tailwind CSS。
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item2">
            <Accordion.Trigger>如何使用 HeroUI?</Accordion.Trigger>
            <Accordion.Content>
              安装 @heroui/react 包,然后导入需要的组件即可使用。
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item3">
            <Accordion.Trigger>支持哪些框架?</Accordion.Trigger>
            <Accordion.Content>
              HeroUI 主要支持 React 和 Next.js,提供完整的 TypeScript 支持。
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </section>

      {/* Avatar + Skeleton + Spinner */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Avatar, Skeleton, Spinner</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Avatar</p>
            <div className="flex gap-2">
              <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" />
              <Avatar src="https://i.pravatar.cc/150?u=2" alt="User 2" />
              <Avatar>AB</Avatar>
            </div>
          </div>

          <Separator orientation="vertical" className="h-16" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Skeleton</p>
            <Skeleton className="h-12 w-32 rounded" />
          </div>

          <Separator orientation="vertical" className="h-16" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Spinner</p>
            <Spinner />
          </div>
        </div>
      </section>

      {/* Tooltip */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tooltip 组件</h2>
        <div className="flex gap-4">
          <Tooltip content="这是一个提示信息">
            <Button variant="secondary">鼠标悬停查看提示</Button>
          </Tooltip>
        </div>
      </section>

      {/* Surface */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Surface 组件</h2>
        <Surface className="p-6">
          <h3 className="text-lg font-semibold">Surface 容器</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Surface 是一个通用的表面容器组件,类似 Card 但更灵活。
          </p>
        </Surface>
      </section>

      {/* 加载状态演示 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">加载状态演示</h2>
        <Card variant="secondary" className="p-6">
          <div className="space-y-4">
            <Button
              variant="primary"
              onPress={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  加载中...
                </>
              ) : (
                "触发加载"
              )}
            </Button>

            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-8 w-1/2 rounded" />
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
