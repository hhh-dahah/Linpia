"use client";

import { useMemo, useState, useTransition } from "react";

import { publishOpportunityAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { ImageUploadInput } from "@/components/ui/image-upload-input";
import { opportunityTypes, schools, skillOptions } from "@/constants";
import { scrollToFirstError } from "@/lib/form";
import { initialActionState, type ActionState } from "@/types/action";
import { opportunitySchema } from "@/validators/opportunity";

type RoleFormValue = {
  id: string;
  roleName: string;
  responsibility: string;
  requirements: string;
  headcount: number;
  weeklyHours: string;
};

type PublishFormState = {
  type: string;
  title: string;
  summary: string;
  schoolScope: string;
  deadline: string;
  weeklyHours: string;
  progress: string;
  trialTask: string;
  feishuUrl: string;
  skillTags: string[];
  deliverables: string[];
  roles: RoleFormValue[];
};

type ErrorMap = Record<string, string>;

function createRole(): RoleFormValue {
  return {
    id: crypto.randomUUID(),
    roleName: "",
    responsibility: "",
    requirements: "",
    headcount: 1,
    weeklyHours: "",
  };
}

const defaultFormState: PublishFormState = {
  type: opportunityTypes[0],
  title: "",
  summary: "",
  schoolScope: schools[0],
  deadline: "",
  weeklyHours: "",
  progress: "",
  trialTask: "",
  feishuUrl: "",
  skillTags: [],
  deliverables: [""],
  roles: [createRole()],
};

export function PublishForm() {
  const [formValues, setFormValues] = useState<PublishFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<ErrorMap>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  const selectedSkillSet = useMemo(() => new Set(formValues.skillTags), [formValues.skillTags]);

  function setValue<K extends keyof PublishFormState>(key: K, value: PublishFormState[K]) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function setRoleValue(index: number, key: keyof RoleFormValue, value: string | number) {
    setFormValues((current) => ({
      ...current,
      roles: current.roles.map((role, roleIndex) =>
        roleIndex === index ? { ...role, [key]: value } : role,
      ),
    }));
  }

  function setDeliverableValue(index: number, value: string) {
    setFormValues((current) => ({
      ...current,
      deliverables: current.deliverables.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  }

  function toggleSkill(skill: string) {
    setFormValues((current) => ({
      ...current,
      skillTags: current.skillTags.includes(skill)
        ? current.skillTags.filter((item) => item !== skill)
        : [...current.skillTags, skill],
    }));
  }

  function addRole() {
    setFormValues((current) => ({ ...current, roles: [...current.roles, createRole()] }));
  }

  function removeRole(index: number) {
    setFormValues((current) => ({
      ...current,
      roles: current.roles.filter((_, roleIndex) => roleIndex !== index),
    }));
  }

  function addDeliverable() {
    setFormValues((current) => ({ ...current, deliverables: [...current.deliverables, ""] }));
  }

  function removeDeliverable(index: number) {
    setFormValues((current) => ({
      ...current,
      deliverables: current.deliverables.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const formData = new FormData(event.currentTarget);
    const payload = {
      type: formValues.type,
      title: formValues.title,
      summary: formValues.summary,
      schoolScope: formValues.schoolScope,
      deadline: formValues.deadline,
      weeklyHours: formValues.weeklyHours,
      progress: formValues.progress,
      trialTask: formValues.trialTask,
      feishuUrl: formValues.feishuUrl,
      skillTags: formValues.skillTags,
      deliverables: formValues.deliverables.map((item) => item.trim()).filter(Boolean),
      roles: formValues.roles.map((role) => ({
        roleName: role.roleName,
        responsibility: role.responsibility,
        requirements: role.requirements,
        headcount: role.headcount,
        weeklyHours: role.weeklyHours,
      })),
      cover: formData.get("cover"),
    };

    const parsed = opportunitySchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: ErrorMap = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "还有必填项没完成，请按提示补充。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await publishOpportunityAction(initialActionState, formData);
      const nextErrors: ErrorMap = {};
      Object.entries(result.fieldErrors || {}).forEach(([key, messages]) => {
        const first = messages?.[0];
        if (first) {
          nextErrors[key] = first;
        }
      });
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        scrollToFirstError(nextErrors);
      }
      setServerState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>机会类型</FieldLabel>
          <select
            name="type"
            value={formValues.type}
            onChange={(event) => setValue("type", event.target.value)}
            className="field-base"
          >
            {opportunityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.type} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>学校范围</FieldLabel>
          <select
            name="schoolScope"
            value={formValues.schoolScope}
            onChange={(event) => setValue("schoolScope", event.target.value)}
            className="field-base"
          >
            {schools.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.schoolScope} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>机会标题</FieldLabel>
          <input
            name="title"
            value={formValues.title}
            onChange={(event) => setValue("title", event.target.value)}
            className="field-base"
            placeholder="例如：智能小车比赛招募前端和结构设计同学"
          />
          <FieldError message={fieldErrors.title} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>截止时间</FieldLabel>
          <input
            name="deadline"
            type="date"
            value={formValues.deadline}
            onChange={(event) => setValue("deadline", event.target.value)}
            className="field-base"
          />
          <FieldError message={fieldErrors.deadline} />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel required>摘要说明</FieldLabel>
        <textarea
          name="summary"
          rows={4}
          value={formValues.summary}
          onChange={(event) => setValue("summary", event.target.value)}
          className="field-base"
          placeholder="用 2-4 句话说明项目是什么、目前做到哪一步、需要什么人。"
        />
        <FieldError message={fieldErrors.summary} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>建议投入</FieldLabel>
          <input
            name="weeklyHours"
            value={formValues.weeklyHours}
            onChange={(event) => setValue("weeklyHours", event.target.value)}
            className="field-base"
            placeholder="每周 6-10 小时"
          />
          <FieldError message={fieldErrors.weeklyHours} />
        </label>

        <label className="block space-y-2">
          <FieldLabel>飞书完整介绍链接</FieldLabel>
          <input
            name="feishuUrl"
            value={formValues.feishuUrl}
            onChange={(event) => setValue("feishuUrl", event.target.value)}
            className="field-base"
            placeholder="可选，不填也可以发布"
          />
          <FieldError message={fieldErrors.feishuUrl} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>当前进度</FieldLabel>
          <textarea
            name="progress"
            rows={3}
            value={formValues.progress}
            onChange={(event) => setValue("progress", event.target.value)}
            className="field-base"
            placeholder="例如：已有 demo、已有选题、已经做完初版验证。"
          />
          <FieldError message={fieldErrors.progress} />
        </label>

        <label className="block space-y-2">
          <FieldLabel>试合作任务</FieldLabel>
          <textarea
            name="trialTask"
            rows={3}
            value={formValues.trialTask}
            onChange={(event) => setValue("trialTask", event.target.value)}
            className="field-base"
            placeholder="可选，不填也可以发布"
          />
          <FieldError message={fieldErrors.trialTask} />
        </label>
      </div>

      <div>
        <FieldLabel>技能标签</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {skillOptions.map((item) => (
            <label
              key={item}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                selectedSkillSet.has(item)
                  ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                  : "border-[rgba(17,40,79,0.12)] bg-white"
              }`}
            >
              <input
                type="checkbox"
                name="skillTags"
                value={item}
                checked={selectedSkillSet.has(item)}
                onChange={() => toggleSkill(item)}
              />
              {item}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.skillTags} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FieldLabel required>角色缺口</FieldLabel>
          <button
            type="button"
            onClick={addRole}
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-2 text-sm font-semibold"
          >
            添加角色
          </button>
        </div>
        <FieldError message={fieldErrors.roles} />
        {formValues.roles.map((role, index) => (
          <div
            key={role.id}
            className="rounded-[1.5rem] border border-[rgba(17,40,79,0.08)] bg-white/80 p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <input
                  name="roleName"
                  value={role.roleName}
                  onChange={(event) => setRoleValue(index, "roleName", event.target.value)}
                  className="field-base"
                  placeholder={`角色 ${index + 1} 名称`}
                />
                <FieldError message={fieldErrors[`roles.${index}.roleName`]} />
              </div>

              <div>
                <input
                  name="roleWeeklyHours"
                  value={role.weeklyHours}
                  onChange={(event) => setRoleValue(index, "weeklyHours", event.target.value)}
                  className="field-base"
                  placeholder="每周投入，如 6 小时"
                />
                <FieldError message={fieldErrors[`roles.${index}.weeklyHours`]} />
              </div>

              <div>
                <textarea
                  name="roleResponsibility"
                  rows={3}
                  value={role.responsibility}
                  onChange={(event) => setRoleValue(index, "responsibility", event.target.value)}
                  className="field-base"
                  placeholder="职责说明"
                />
                <FieldError message={fieldErrors[`roles.${index}.responsibility`]} />
              </div>

              <div>
                <textarea
                  name="roleRequirements"
                  rows={3}
                  value={role.requirements}
                  onChange={(event) => setRoleValue(index, "requirements", event.target.value)}
                  className="field-base"
                  placeholder="能力要求"
                />
                <FieldError message={fieldErrors[`roles.${index}.requirements`]} />
              </div>

              <div>
                <input
                  name="roleHeadcount"
                  type="number"
                  min={1}
                  value={role.headcount}
                  onChange={(event) =>
                    setRoleValue(index, "headcount", Number(event.target.value || 1))
                  }
                  className="field-base"
                />
                <FieldError message={fieldErrors[`roles.${index}.headcount`]} />
              </div>
            </div>

            {formValues.roles.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRole(index)}
                className="mt-4 text-sm font-semibold text-[var(--danger)]"
              >
                删除这个角色
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FieldLabel>交付项</FieldLabel>
          <button
            type="button"
            onClick={addDeliverable}
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-2 text-sm font-semibold"
          >
            添加交付项
          </button>
        </div>
        <FieldError message={fieldErrors.deliverables} />
        {formValues.deliverables.map((item, index) => (
          <div key={`${index}-${formValues.deliverables.length}`} className="flex gap-3">
            <div className="flex-1">
              <input
                name="deliverables"
                value={item}
                onChange={(event) => setDeliverableValue(index, event.target.value)}
                className="field-base"
                placeholder={`交付项 ${index + 1}`}
              />
              <FieldError message={fieldErrors[`deliverables.${index}`]} />
            </div>
            {formValues.deliverables.length > 1 ? (
              <button
                type="button"
                onClick={() => removeDeliverable(index)}
                className="rounded-full px-4 text-sm font-semibold text-[var(--danger)]"
              >
                删除
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <ImageUploadInput
        name="cover"
        label="机会封面（可选）"
        helper="建议 200KB 左右，用于列表卡片展示。"
      />

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "发布中..." : "发布机会"}
      </button>
    </form>
  );
}
