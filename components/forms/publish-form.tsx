"use client";

import { useMemo, useState, useTransition } from "react";

import { publishOpportunityAction } from "@/app/actions";
import { recruitmentTagPresets } from "@/constants";
import { scrollToFirstError } from "@/lib/form";
import type { AccountRole } from "@/types/account";
import { initialActionState, type ActionState } from "@/types/action";
import { opportunityTypes } from "@/types/opportunity";
import { FormFeedback } from "../ui/form-feedback";
import { FieldError } from "../ui/field-error";
import { FieldLabel } from "../ui/field-label";
import { ImageUploadInput } from "../ui/image-upload-input";
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
  title: string;
  type: string;
  organization: string;
  summary: string;
  deadline: string;
  weeklyHours: string;
  applicationRequirement: string;
  contactInfo: string;
  feishuUrl: string;
  presetTags: string[];
  customTagInput: string;
  customTags: string[];
  roles: RoleFormValue[];
  projectName: string;
  peopleNeeded: string;
  researchDirection: string;
  targetAudience: string;
  supportMethod: string;
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
  title: "",
  type: opportunityTypes[0],
  organization: "",
  summary: "",
  deadline: "",
  weeklyHours: "",
  applicationRequirement: "",
  contactInfo: "",
  feishuUrl: "",
  presetTags: [],
  customTagInput: "",
  customTags: [],
  roles: [createRole()],
  projectName: "",
  peopleNeeded: "",
  researchDirection: "",
  targetAudience: "",
  supportMethod: "",
};

export function PublishForm({ role }: { role: AccountRole }) {
  const [formValues, setFormValues] = useState<PublishFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<ErrorMap>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  const selectedPresetTagSet = useMemo(() => new Set(formValues.presetTags), [formValues.presetTags]);

  function setValue<K extends keyof PublishFormState>(key: K, value: PublishFormState[K]) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function setRoleValue(index: number, key: keyof RoleFormValue, value: string | number) {
    setFormValues((current) => ({
      ...current,
      roles: current.roles.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function togglePresetTag(tag: string) {
    setFormValues((current) => ({
      ...current,
      presetTags: current.presetTags.includes(tag)
        ? current.presetTags.filter((item) => item !== tag)
        : [...current.presetTags, tag],
    }));
  }

  function addCustomTag() {
    const tag = formValues.customTagInput.trim();
    if (!tag || formValues.customTags.includes(tag) || formValues.customTags.length >= 5) {
      return;
    }

    setFormValues((current) => ({
      ...current,
      customTags: [...current.customTags, tag],
      customTagInput: "",
    }));
  }

  function removeCustomTag(tag: string) {
    setFormValues((current) => ({
      ...current,
      customTags: current.customTags.filter((item) => item !== tag),
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const formData = new FormData(event.currentTarget);
    const payload =
      role === "student"
        ? {
            role,
            type: formValues.type,
            title: formValues.title,
            organization: formValues.organization,
            summary: formValues.summary,
            deadline: formValues.deadline,
            weeklyHours: formValues.weeklyHours,
            applicationRequirement: formValues.applicationRequirement,
            contactInfo: formValues.contactInfo,
            feishuUrl: formValues.feishuUrl,
            presetTags: formValues.presetTags,
            customTags: formValues.customTags,
            roles: formValues.roles.map((item) => ({
              roleName: item.roleName,
              responsibility: item.responsibility,
              requirements: item.requirements,
              headcount: item.headcount,
              weeklyHours: item.weeklyHours,
            })),
            cover: formData.get("cover"),
            projectName: formValues.projectName,
            peopleNeeded: formValues.peopleNeeded,
          }
        : {
            role,
            type: formValues.type,
            title: formValues.title,
            organization: formValues.organization,
            summary: formValues.summary,
            deadline: formValues.deadline,
            weeklyHours: formValues.weeklyHours,
            applicationRequirement: formValues.applicationRequirement,
            contactInfo: formValues.contactInfo,
            feishuUrl: formValues.feishuUrl,
            presetTags: formValues.presetTags,
            customTags: formValues.customTags,
            roles: formValues.roles.map((item) => ({
              roleName: item.roleName,
              responsibility: item.responsibility,
              requirements: item.requirements,
              headcount: item.headcount,
              weeklyHours: item.weeklyHours,
            })),
            cover: formData.get("cover"),
            researchDirection: formValues.researchDirection,
            targetAudience: formValues.targetAudience,
            supportMethod: formValues.supportMethod,
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
      <input type="hidden" name="role" value={role} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>招募标题</FieldLabel>
          <input
            name="title"
            value={formValues.title}
            onChange={(event) => setValue("title", event.target.value)}
            className="field-base"
            placeholder={role === "student" ? "例如：数学建模国赛招募建模与答辩同学" : "例如：实验室开放学生申请"}
          />
          <FieldError message={fieldErrors.title} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>招募类型</FieldLabel>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>{role === "student" ? "学校 / 团队" : "学校 / 学院 / 实验室"}</FieldLabel>
          <input
            name="organization"
            value={formValues.organization}
            onChange={(event) => setValue("organization", event.target.value)}
            className="field-base"
            placeholder={role === "student" ? "例如：兰州交通大学 数模队" : "例如：兰州交通大学 AI+设计工作室"}
          />
          <FieldError message={fieldErrors.organization} />
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

      {role === "student" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <FieldLabel required>项目 / 比赛名称</FieldLabel>
            <input
              name="projectName"
              value={formValues.projectName}
              onChange={(event) => setValue("projectName", event.target.value)}
              className="field-base"
              placeholder="例如：互联网+ 校赛 / 创新项目"
            />
            <FieldError message={fieldErrors.projectName} />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>需要什么人</FieldLabel>
            <input
              name="peopleNeeded"
              value={formValues.peopleNeeded}
              onChange={(event) => setValue("peopleNeeded", event.target.value)}
              className="field-base"
              placeholder="例如：前端、设计、答辩表达"
            />
            <FieldError message={fieldErrors.peopleNeeded} />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <FieldLabel required>研究 / 指导方向</FieldLabel>
            <input
              name="researchDirection"
              value={formValues.researchDirection}
              onChange={(event) => setValue("researchDirection", event.target.value)}
              className="field-base"
              placeholder="例如：AI 内容工具、机器人控制、科研训练"
            />
            <FieldError message={fieldErrors.researchDirection} />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>面向对象</FieldLabel>
            <input
              name="targetAudience"
              value={formValues.targetAudience}
              onChange={(event) => setValue("targetAudience", event.target.value)}
              className="field-base"
              placeholder="例如：对设计 / 开发 / 科研感兴趣的学生"
            />
            <FieldError message={fieldErrors.targetAudience} />
          </label>
        </div>
      )}

      {role === "mentor" ? (
        <label className="block space-y-2">
          <FieldLabel required>支持方式</FieldLabel>
          <input
            name="supportMethod"
            value={formValues.supportMethod}
            onChange={(event) => setValue("supportMethod", event.target.value)}
            className="field-base"
            placeholder="例如：周期指导、项目评审、实验室协作"
          />
          <FieldError message={fieldErrors.supportMethod} />
        </label>
      ) : null}

      <label className="block space-y-2">
        <FieldLabel required>需求说明</FieldLabel>
        <textarea
          name="summary"
          rows={4}
          value={formValues.summary}
          onChange={(event) => setValue("summary", event.target.value)}
          className="field-base"
          placeholder={
            role === "student"
              ? "说清楚项目现在到哪一步、为什么要招人、希望一起完成什么。"
              : "说清楚你提供什么支持、适合什么学生加入、合作方式是什么。"
          }
        />
        <FieldError message={fieldErrors.summary} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>时间安排</FieldLabel>
          <input
            name="weeklyHours"
            value={formValues.weeklyHours}
            onChange={(event) => setValue("weeklyHours", event.target.value)}
            className="field-base"
            placeholder="例如：每周 6-8 小时"
          />
          <FieldError message={fieldErrors.weeklyHours} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>联系方式</FieldLabel>
          <input
            name="contactInfo"
            value={formValues.contactInfo}
            onChange={(event) => setValue("contactInfo", event.target.value)}
            className="field-base"
            placeholder="例如：平台申请后统一联系 / 飞书群 / 微信备注方式"
          />
          <FieldError message={fieldErrors.contactInfo} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel>报名要求</FieldLabel>
          <textarea
            name="applicationRequirement"
            rows={3}
            value={formValues.applicationRequirement}
            onChange={(event) => setValue("applicationRequirement", event.target.value)}
            className="field-base"
            placeholder="可选，例如：希望附上作品、经历或试合作材料。"
          />
          <FieldError message={fieldErrors.applicationRequirement} />
        </label>

        <label className="block space-y-2">
          <FieldLabel>飞书补充链接</FieldLabel>
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

      <div className="space-y-4">
        <FieldLabel>预设标签</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {recruitmentTagPresets.map((item) => (
            <label
              key={item}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                selectedPresetTagSet.has(item)
                  ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                  : "border-[rgba(17,40,79,0.12)] bg-white"
              }`}
            >
              <input
                type="checkbox"
                name="presetTags"
                value={item}
                checked={selectedPresetTagSet.has(item)}
                onChange={() => togglePresetTag(item)}
              />
              {item}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.presetTags} />
      </div>

      <div className="space-y-3">
        <FieldLabel>自定义标签</FieldLabel>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={formValues.customTagInput}
            onChange={(event) => setValue("customTagInput", event.target.value)}
            className="field-base flex-1"
            placeholder="2-10 个字，最多 5 个"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-3 text-sm font-semibold"
          >
            添加标签
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formValues.customTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeCustomTag(tag)}
              className="rounded-full bg-[rgba(17,40,79,0.06)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              {tag} ×
            </button>
          ))}
        </div>
        {formValues.customTags.map((tag) => (
          <input key={tag} type="hidden" name="customTags" value={tag} />
        ))}
        <FieldError message={fieldErrors.customTags} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FieldLabel required>{role === "student" ? "需要的成员" : "招募方向 / 成员说明"}</FieldLabel>
          <button
            type="button"
            onClick={addRole}
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-2 text-sm font-semibold"
          >
            添加一项
          </button>
        </div>
        <FieldError message={fieldErrors.roles} />

        {formValues.roles.map((item, index) => (
          <div
            key={item.id}
            className="rounded-[1.5rem] border border-[rgba(17,40,79,0.08)] bg-white/80 p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <input
                  name="roleName"
                  value={item.roleName}
                  onChange={(event) => setRoleValue(index, "roleName", event.target.value)}
                  className="field-base"
                  placeholder={role === "student" ? "例如：前端 / 答辩 / 后端" : "例如：项目协同 / 视觉设计 / 研究助理"}
                />
                <FieldError message={fieldErrors[`roles.${index}.roleName`]} />
              </div>

              <div>
                <input
                  name="roleWeeklyHours"
                  value={item.weeklyHours}
                  onChange={(event) => setRoleValue(index, "weeklyHours", event.target.value)}
                  className="field-base"
                  placeholder="预计投入，例如每周 6 小时"
                />
                <FieldError message={fieldErrors[`roles.${index}.weeklyHours`]} />
              </div>

              <div>
                <textarea
                  name="roleResponsibility"
                  rows={3}
                  value={item.responsibility}
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
                  value={item.requirements}
                  onChange={(event) => setRoleValue(index, "requirements", event.target.value)}
                  className="field-base"
                  placeholder="报名要求"
                />
                <FieldError message={fieldErrors[`roles.${index}.requirements`]} />
              </div>

              <div>
                <input
                  name="roleHeadcount"
                  type="number"
                  min={1}
                  value={item.headcount}
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
                删除这一项
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <ImageUploadInput name="cover" label="招募封面" helper="可选，用于招募卡片展示。" />

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "发布中..." : "发布招募"}
      </button>
    </form>
  );
}
