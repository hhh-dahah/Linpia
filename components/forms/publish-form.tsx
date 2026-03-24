"use client";

import { useMemo, useState, useTransition } from "react";

import { publishOpportunityAction } from "@/app/actions";
import { recruitmentTagPresets } from "@/constants";
import { scrollToFirstError } from "@/lib/form";
import type { AccountRole } from "@/types/account";
import { initialActionState, type ActionState } from "@/types/action";
import {
  applicationRequiredItemLabels,
  applicationRequiredItems,
  opportunityTypes,
} from "@/types/opportunity";
import { opportunitySchema } from "@/validators/opportunity";
import { FieldError } from "../ui/field-error";
import { FormFeedback } from "../ui/form-feedback";
import { FieldLabel } from "../ui/field-label";
import { ImageUploadInput } from "../ui/image-upload-input";

type PublishFormState = {
  title: string;
  type: string;
  projectName: string;
  summary: string;
  contactInfo: string;
  organization: string;
  deadline: string;
  weeklyHours: string;
  feishuUrl: string;
  presetTags: string[];
  customTagInput: string;
  customTags: string[];
  applicationRequiredItems: string[];
  applicationRequirementNote: string;
};

type ErrorMap = Record<string, string>;

const defaultFormState: PublishFormState = {
  title: "",
  type: opportunityTypes[0],
  projectName: "",
  summary: "",
  contactInfo: "",
  organization: "",
  deadline: "",
  weeklyHours: "",
  feishuUrl: "",
  presetTags: [],
  customTagInput: "",
  customTags: [],
  applicationRequiredItems: [],
  applicationRequirementNote: "",
};

export function PublishForm({ role }: { role: AccountRole }) {
  const [formValues, setFormValues] = useState<PublishFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<ErrorMap>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  const selectedPresetTagSet = useMemo(() => new Set(formValues.presetTags), [formValues.presetTags]);
  const selectedRequirementSet = useMemo(
    () => new Set(formValues.applicationRequiredItems),
    [formValues.applicationRequiredItems],
  );

  function setValue<K extends keyof PublishFormState>(key: K, value: PublishFormState[K]) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function togglePresetTag(tag: string) {
    setFormValues((current) => ({
      ...current,
      presetTags: current.presetTags.includes(tag)
        ? current.presetTags.filter((item) => item !== tag)
        : [...current.presetTags, tag],
    }));
  }

  function toggleRequirement(item: string) {
    setFormValues((current) => ({
      ...current,
      applicationRequiredItems: current.applicationRequiredItems.includes(item)
        ? current.applicationRequiredItems.filter((value) => value !== item)
        : [...current.applicationRequiredItems, item],
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const formData = new FormData(event.currentTarget);
    const payload = {
      role,
      type: formValues.type,
      title: formValues.title,
      projectName: formValues.projectName,
      summary: formValues.summary,
      contactInfo: formValues.contactInfo,
      organization: formValues.organization,
      deadline: formValues.deadline,
      weeklyHours: formValues.weeklyHours,
      feishuUrl: formValues.feishuUrl,
      presetTags: formValues.presetTags,
      customTags: formValues.customTags,
      applicationRequiredItems: formValues.applicationRequiredItems,
      applicationRequirementNote: formValues.applicationRequirementNote,
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
      <input type="hidden" name="role" value={role} />
      {formValues.presetTags.map((tag) => (
        <input key={`preset-${tag}`} type="hidden" name="presetTags" value={tag} />
      ))}
      {formValues.customTags.map((tag) => (
        <input key={`custom-${tag}`} type="hidden" name="customTags" value={tag} />
      ))}
      {formValues.applicationRequiredItems.map((item) => (
        <input key={`required-${item}`} type="hidden" name="applicationRequiredItems" value={item} />
      ))}

      <section className="space-y-4 rounded-[1.75rem] border border-[rgba(17,40,79,0.08)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[var(--foreground)]">基础发布信息</h3>
          <p className="text-sm leading-6 text-[var(--muted)]">先把最核心的信息发出去，1 分钟也能完成。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <FieldLabel required>招募标题</FieldLabel>
            <input
              name="title"
              value={formValues.title}
              onChange={(event) => setValue("title", event.target.value)}
              className="field-base"
              placeholder="例如：数学建模国赛招募前端与答辩同学"
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

        <label className="block space-y-2">
          <FieldLabel required>项目 / 比赛名称</FieldLabel>
          <input
            name="projectName"
            value={formValues.projectName}
            onChange={(event) => setValue("projectName", event.target.value)}
            className="field-base"
            placeholder="例如：互联网+ 校赛 / 创新项目 / 实验室课题"
          />
          <FieldError message={fieldErrors.projectName} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>详细需求说明</FieldLabel>
          <textarea
            name="summary"
            rows={5}
            value={formValues.summary}
            onChange={(event) => setValue("summary", event.target.value)}
            className="field-base"
            placeholder="把你现在在做什么、希望找什么样的人、加入后主要一起完成什么写清楚。"
          />
          <p className="text-sm leading-6 text-[var(--muted)]">
            建议写清楚：你现在在做什么、希望找什么人、加入后主要做什么。
          </p>
          <FieldError message={fieldErrors.summary} />
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
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-[rgba(36,107,250,0.14)] bg-[rgba(36,107,250,0.04)] p-5 shadow-[0_18px_40px_rgba(36,107,250,0.04)]">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[var(--foreground)]">报名者需提交项</h3>
          <p className="text-sm leading-6 text-[var(--muted)]">按需勾选，报名者会按这些要求提交信息。</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {applicationRequiredItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleRequirement(item)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                selectedRequirementSet.has(item)
                  ? "border-[rgba(36,107,250,0.28)] bg-[rgba(36,107,250,0.1)] text-primary-strong"
                  : "border-[rgba(17,40,79,0.1)] bg-white text-[var(--foreground)]"
              }`}
            >
              {applicationRequiredItemLabels[item]}
            </button>
          ))}
        </div>
        <FieldError message={fieldErrors.applicationRequiredItems} />

        <label className="block space-y-2">
          <FieldLabel>其他要求</FieldLabel>
          <textarea
            name="applicationRequirementNote"
            rows={3}
            value={formValues.applicationRequirementNote}
            onChange={(event) => setValue("applicationRequirementNote", event.target.value)}
            className="field-base"
            placeholder="选填，例如：希望附上相关背景、擅长方向或补充材料。"
          />
          <FieldError message={fieldErrors.applicationRequirementNote} />
        </label>
      </section>

      <details className="group rounded-[1.75rem] border border-[rgba(17,40,79,0.08)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.03)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--foreground)]">
          <span>高级设置（选填）</span>
          <span className="text-sm font-medium text-[var(--muted)] transition group-open:rotate-180">⌄</span>
        </summary>

        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <FieldLabel>学校 / 团队</FieldLabel>
              <input
                name="organization"
                value={formValues.organization}
                onChange={(event) => setValue("organization", event.target.value)}
                className="field-base"
                placeholder="例如：兰州交通大学 / 数模队"
              />
              <FieldError message={fieldErrors.organization} />
            </label>

            <label className="block space-y-2">
              <FieldLabel>截止时间</FieldLabel>
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <FieldLabel>时间安排</FieldLabel>
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
              <FieldLabel>飞书补充链接</FieldLabel>
              <input
                name="feishuUrl"
                value={formValues.feishuUrl}
                onChange={(event) => setValue("feishuUrl", event.target.value)}
                className="field-base"
                placeholder="选填，不填也可以发布"
              />
              <FieldError message={fieldErrors.feishuUrl} />
            </label>
          </div>

          <div className="space-y-4">
            <FieldLabel>预设标签</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {recruitmentTagPresets.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => togglePresetTag(item)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    selectedPresetTagSet.has(item)
                      ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-primary-strong"
                      : "border-[rgba(17,40,79,0.12)] bg-white text-[var(--foreground)]"
                  }`}
                >
                  {item}
                </button>
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
            <FieldError message={fieldErrors.customTags} />
          </div>

          <ImageUploadInput name="cover" label="招募封面" helper="选填，用于招募卡片展示。" />
        </div>
      </details>

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
