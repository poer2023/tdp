"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction, updateProjectAction } from "@/app/admin/projects/actions";
import {
  LuminaActionBtn,
  LuminaEditForm,
  LuminaInput,
  LuminaTextArea,
} from "./lumina-shared";
import { ImageUploadArea } from "./image-upload-area";

type ProjectFormValues = {
  title: string;
  description: string;
  cover: string;
  role: string;
  year: string;
  demoUrl: string;
  repoUrl: string;
  technologies: string;
  features: string;
  statsJson: string;
};

type ProjectFormProps = {
  defaultValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
  projectId?: string;
};

export function ProjectForm({
  defaultValues,
  submitLabel = "保存项目",
  projectId,
}: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    cover: defaultValues?.cover ?? "",
    role: defaultValues?.role ?? "",
    year: defaultValues?.year ?? "",
    demoUrl: defaultValues?.demoUrl ?? "",
    repoUrl: defaultValues?.repoUrl ?? "",
    technologies: defaultValues?.technologies ?? "",
    features: defaultValues?.features ?? "",
    statsJson: defaultValues?.statsJson ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const payload = {
        id: projectId,
        title: values.title,
        description: values.description,
        cover: values.cover || null,
        role: values.role,
        year: values.year,
        demoUrl: values.demoUrl,
        repoUrl: values.repoUrl,
        technologies: values.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        features: values.features
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        statsJson: values.statsJson,
      };

      const result = projectId
        ? await updateProjectAction(payload)
        : await createProjectAction(payload);
      if (result.status === "success") {
        setMessage("已保存");
        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LuminaEditForm
        title="项目详情"
        description="以 Lumina 风格展示项目卡片，包括封面、技术栈和亮点。"
        footer={
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              技术栈、功能点使用英文逗号分隔
            </span>
            <div className="flex items-center gap-3">
              {message && <span className="text-xs text-sage-600 dark:text-sage-300">{message}</span>}
              <LuminaActionBtn type="submit" disabled={pending}>
                {pending ? "保存中..." : submitLabel}
              </LuminaActionBtn>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <LuminaInput
            label="标题"
            placeholder="项目名称"
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
          />
          <LuminaInput
            label="年份"
            placeholder="2024"
            value={values.year}
            onChange={(event) => setValues((prev) => ({ ...prev, year: event.target.value }))}
          />
          <LuminaInput
            label="角色"
            placeholder="Fullstack / PM / Designer"
            value={values.role}
            onChange={(event) => setValues((prev) => ({ ...prev, role: event.target.value }))}
          />
          <LuminaInput
            label="Demo URL"
            placeholder="https://"
            value={values.demoUrl}
            onChange={(event) => setValues((prev) => ({ ...prev, demoUrl: event.target.value }))}
          />
          <LuminaInput
            label="Repo URL"
            placeholder="https://github.com/..."
            value={values.repoUrl}
            onChange={(event) => setValues((prev) => ({ ...prev, repoUrl: event.target.value }))}
          />
          <LuminaInput
            label="技术栈"
            placeholder="Next.js,Prisma,Recharts"
            value={values.technologies}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, technologies: event.target.value }))
            }
          />
        </div>

        <LuminaTextArea
          label="描述"
          placeholder="一句话介绍项目价值与亮点"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
        />

        <LuminaTextArea
          label="功能点"
          placeholder="Auth, Admin UI, File upload"
          rows={2}
          value={values.features}
          onChange={(event) => setValues((prev) => ({ ...prev, features: event.target.value }))}
        />

        <LuminaTextArea
          label="统计数据 (JSON)"
          description="可输入键值对（如页面、转化率、PV），后续可转为图表"
          rows={3}
          value={values.statsJson}
          onChange={(event) => setValues((prev) => ({ ...prev, statsJson: event.target.value }))}
        />

        <ImageUploadArea
          label="封面图"
          description="可选，推荐 3:2 比例"
          multiple={false}
          onChange={(files) => {
            if (!files?.[0]) return;
            setValues((prev) => ({ ...prev, cover: files[0].name }));
          }}
          onUploaded={(urls) => {
            if (!urls[0]) return;
            setValues((prev) => ({ ...prev, cover: urls[0] }));
          }}
        />
      </LuminaEditForm>
    </form>
  );
}
