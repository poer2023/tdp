"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveLifeLogData } from "@/app/admin/data/actions";
import { LuminaActionBtn, LuminaDataSection, LuminaInput } from "./lumina-shared";

type Skill = { name: string; level: number; category?: string };
type Routine = { name: string; hours: number; color: string };
type DayStat = { label: string; value: number };

type DataSectionProps = {
  initialSkills?: Skill[];
  initialRoutine?: Routine[];
  initialSteps?: DayStat[];
  initialPhotos?: DayStat[];
};

export function DataSections({
  initialSkills,
  initialRoutine,
  initialSteps,
  initialPhotos,
}: DataSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [skills, setSkills] = useState<Skill[]>(
    initialSkills ?? [
      { name: "TypeScript", level: 85, category: "Engineering" },
      { name: "Product", level: 70, category: "Strategy" },
    ]
  );
  const [routine, setRoutine] = useState<Routine[]>(
    initialRoutine ?? [
      { name: "阅读", hours: 1, color: "#10b981" },
      { name: "健身", hours: 0.5, color: "#6366f1" },
    ]
  );
  const [steps, setSteps] = useState<DayStat[]>(
    initialSteps ?? [
      { label: "Mon", value: 5200 },
      { label: "Tue", value: 6800 },
      { label: "Wed", value: 7300 },
      { label: "Thu", value: 4500 },
      { label: "Fri", value: 6200 },
      { label: "Sat", value: 8900 },
      { label: "Sun", value: 10400 },
    ]
  );
  const [photos, setPhotos] = useState<DayStat[]>(
    initialPhotos ?? [
      { label: "Mon", value: 3 },
      { label: "Tue", value: 4 },
      { label: "Wed", value: 1 },
      { label: "Thu", value: 2 },
      { label: "Fri", value: 3 },
      { label: "Sat", value: 6 },
      { label: "Sun", value: 5 },
    ]
  );
  const [message, setMessage] = useState<string | null>(null);

  const persist = () => {
    setMessage(null);
    startTransition(async () => {
      await saveLifeLogData({
        skills,
        routines: routine.map((item) => ({ name: item.name, value: item.hours, color: item.color })),
        steps: steps.map((day, idx) => ({
          date: buildDate(idx),
          value: day.value,
        })),
        photos: photos.map((day, idx) => ({
          date: buildDate(idx),
          value: day.value,
        })),
      });
      setMessage("已保存");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <LuminaDataSection
        title="Skills"
        description="等级条直接对应 Lumina 样式，后续可接入后端数据。"
        action={
          <LuminaActionBtn size="sm" onClick={persist} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </LuminaActionBtn>
        }
      >
        {message && <p className="text-xs text-sage-600 dark:text-sage-300">{message}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {skills.map((skill, idx) => (
            <div key={skill.name} className="space-y-2 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
              <div className="flex items-center justify-between text-sm font-semibold text-stone-800 dark:text-stone-100">
                <span>{skill.name}</span>
                <span className="text-xs text-stone-500">{skill.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={skill.level}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSkills((prev) => prev.map((s, sIdx) => (sIdx === idx ? { ...s, level: value } : s)));
                  }}
                  className="h-2 w-full cursor-pointer rounded-full bg-stone-200 accent-sage-500 dark:bg-stone-800"
                />
                <span className="w-12 text-right text-xs text-stone-500 dark:text-stone-300">{skill.level}%</span>
              </div>
            </div>
          ))}
        </div>
      </LuminaDataSection>

      <LuminaDataSection
        title="Routine Data"
        description="活动 + 小时分布，颜色直接映射到前端图例。"
        action={
          <LuminaActionBtn size="sm" onClick={persist} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </LuminaActionBtn>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {routine.map((item, idx) => (
            <div key={item.name} className="space-y-2 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
              <LuminaInput
                label="活动"
                value={item.name}
                onChange={(event) =>
                  setRoutine((prev) => prev.map((r, rIdx) => (rIdx === idx ? { ...r, name: event.target.value } : r)))
                }
              />
              <LuminaInput
                label="小时"
                type="number"
                value={item.hours}
                onChange={(event) =>
                  setRoutine((prev) =>
                    prev.map((r, rIdx) => (rIdx === idx ? { ...r, hours: Number(event.target.value) } : r))
                  )
                }
              />
              <LuminaInput
                label="颜色"
                type="color"
                value={item.color}
                onChange={(event) =>
                  setRoutine((prev) =>
                    prev.map((r, rIdx) => (rIdx === idx ? { ...r, color: event.target.value } : r))
                  )
                }
              />
            </div>
          ))}
        </div>
      </LuminaDataSection>

      <LuminaDataSection
        title="Daily Steps"
        description="保持 7 天录入，方便生成折线或网格图。"
        action={
          <LuminaActionBtn size="sm" onClick={persist} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </LuminaActionBtn>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((day, idx) => (
            <div key={day.label} className="space-y-2 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {day.label}
              </p>
              <LuminaInput
                label="步数"
                type="number"
                value={day.value}
                onChange={(event) =>
                  setSteps((prev) =>
                    prev.map((d, dIdx) => (dIdx === idx ? { ...d, value: Number(event.target.value) } : d))
                  )
                }
              />
            </div>
          ))}
        </div>
      </LuminaDataSection>

      <LuminaDataSection
        title="Photo Stats"
        description="轻量输入，每天的拍摄数量，方便与相册数据对齐。"
        action={
          <LuminaActionBtn size="sm" onClick={persist} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </LuminaActionBtn>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((day, idx) => (
            <div key={day.label} className="space-y-2 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {day.label}
              </p>
              <LuminaInput
                label="数量"
                type="number"
                value={day.value}
                onChange={(event) =>
                  setPhotos((prev) =>
                    prev.map((d, dIdx) => (dIdx === idx ? { ...d, value: Number(event.target.value) } : d))
                  )
                }
              />
            </div>
          ))}
        </div>
      </LuminaDataSection>
    </div>
  );
}

function buildDate(index: number) {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - (6 - index));
  return date.toISOString();
}
