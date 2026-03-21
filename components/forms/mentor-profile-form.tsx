"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { saveMentorProfileAction } from "@/app/actions";
import { mentorSupportMethods, mentorSupportScopes, skillOptions } from "@/constants";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { scrollToFirstError } from "@/lib/form";
import { initialActionState, type ActionState } from "@/types/action";
import type { MentorCard } from "@/types/mentor";
import { mentorSchema } from "@/validators/mentor";

type MentorProfileFormValues = {
  name: string;
  school: string;
  college: string;
  lab: string;
  organization: string;
  direction: string;
  directionTags: string[];
  supportScope: string[];
  supportMethod: string;
  contactMode: string;
  applicationNotes: string;
  isOpen: boolean;
};

function getInitialValues(profile?: MentorCard | null): MentorProfileFormValues {
  return {
    name: profile?.name || "",
    school: profile?.school || "",
    college: profile?.college || "",
    lab: profile?.lab || "",
    organization: profile?.organization || "",
    direction: profile?.direction || "",
    directionTags: profile?.directionTags || [],
    supportScope: profile?.supportScope || [],
    supportMethod: profile?.supportMethod || "",
    contactMode: profile?.contactMode || "",
    applicationNotes: profile?.applicationNotes || "",
    isOpen: profile?.isOpen ?? true,
  };
}

export function MentorProfileForm({
  profile,
  draftStorageKey,
}: {
  profile?: MentorCard | null;
  draftStorageKey?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<MentorProfileFormValues>(() => getInitialValues(profile));
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!draftStorageKey) {
      setDraftReady(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MentorProfileFormValues>;
        setValues((current) => ({
          ...current,
          ...parsed,
          directionTags: Array.isArray(parsed.directionTags) ? parsed.directionTags : current.directionTags,
          supportScope: Array.isArray(parsed.supportScope) ? parsed.supportScope : current.supportScope,
          isOpen: typeof parsed.isOpen === "boolean" ? parsed.isOpen : current.isOpen,
        }));
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey || !draftReady) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(values));
  }, [draftReady, draftStorageKey, values]);

  useEffect(() => {
    if (serverState.status === "success" && draftStorageKey) {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, serverState.status]);

  const selectedDirections = useMemo(() => new Set(values.directionTags), [values.directionTags]);
  const selectedSupportScope = useMemo(() => new Set(values.supportScope), [values.supportScope]);

  function setValue<K extends keyof MentorProfileFormValues>(key: K, value: MentorProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleFromList(key: "directionTags" | "supportScope", item: string) {
    setValues((current) => {
      const exists = current[key].includes(item);
      return {
        ...current,
        [key]: exists ? current[key].filter((value) => value !== item) : [...current[key], item],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const parsed = mentorSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "导师资料还有几项没填好，请按提示修改。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveMentorProfileAction(initialActionState, formData);
      const nextErrors: Record<string, string> = {};
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
          <FieldLabel required>姓名</FieldLabel>
          <input
            name="name"
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            className="field-base"
            placeholder="导师姓名"
          />
          <FieldError message={fieldErrors.name} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>学校 / 学院 / 实验室</FieldLabel>
          <input
            name="organization"
            value={values.organization}
            onChange={(event) => setValue("organization", event.target.value)}
            className="field-base"
            placeholder="例如：兰州交通大学 / AI 实验室"
          />
          <FieldError message={fieldErrors.organization} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block space-y-2">
          <FieldLabel>学校</FieldLabel>
          <input
            name="school"
            value={values.school}
            onChange={(event) => setValue("school", event.target.value)}
            className="field-base"
            placeholder="例如：兰州交通大学"
          />
        </label>

        <label className="block space-y-2">
          <FieldLabel>学院</FieldLabel>
          <input
            name="college"
            value={values.college}
            onChange={(event) => setValue("college", event.target.value)}
            className="field-base"
            placeholder="例如：计算机学院"
          />
        </label>

        <label className="block space-y-2">
          <FieldLabel>实验室 / 工作室</FieldLabel>
          <input
            name="lab"
            value={values.lab}
            onChange={(event) => setValue("lab", event.target.value)}
            className="field-base"
            placeholder="例如：机器视觉实验室"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel required>研究方向</FieldLabel>
        <textarea
          name="direction"
          rows={4}
          value={values.direction}
          onChange={(event) => setValue("direction", event.target.value)}
          className="field-base"
          placeholder="例如：AI 内容工具、机器人控制系统、学生创新项目指导。"
        />
        <FieldError message={fieldErrors.direction} />
      </label>

      <div>
        <FieldLabel>方向标签</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {skillOptions.map((item) => (
            <label
              key={item}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                selectedDirections.has(item)
                  ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                  : "border-[rgba(17,40,79,0.12)] bg-white"
              }`}
            >
              <input
                type="checkbox"
                name="directionTags"
                value={item}
                checked={selectedDirections.has(item)}
                onChange={() => toggleFromList("directionTags", item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>可支持内容</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {mentorSupportScopes.map((item) => (
            <label
              key={item}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                selectedSupportScope.has(item)
                  ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                  : "border-[rgba(17,40,79,0.12)] bg-white"
              }`}
            >
              <input
                type="checkbox"
                name="supportScope"
                value={item}
                checked={selectedSupportScope.has(item)}
                onChange={() => toggleFromList("supportScope", item)}
              />
              {item}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.supportScope} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>支持方式</FieldLabel>
          <select
            name="supportMethod"
            value={values.supportMethod}
            onChange={(event) => setValue("supportMethod", event.target.value)}
            className="field-base"
          >
            <option value="">请选择</option>
            {mentorSupportMethods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.supportMethod} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>联系方式 / 平台沟通方式</FieldLabel>
          <input
            name="contactMode"
            value={values.contactMode}
            onChange={(event) => setValue("contactMode", event.target.value)}
            className="field-base"
            placeholder="例如：平台申请后统一沟通"
          />
          <FieldError message={fieldErrors.contactMode} />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel>申请说明</FieldLabel>
        <textarea
          name="applicationNotes"
          rows={4}
          value={values.applicationNotes}
          onChange={(event) => setValue("applicationNotes", event.target.value)}
          className="field-base"
          placeholder="例如：适合哪些学生申请，希望申请时补充什么信息。"
        />
        <FieldError message={fieldErrors.applicationNotes} />
      </label>

      <label className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-4">
        <input
          type="checkbox"
          name="isOpen"
          checked={values.isOpen}
          onChange={(event) => setValue("isOpen", event.target.checked)}
        />
        <div>
          <p className="font-semibold text-[var(--foreground)]">是否开放申请</p>
          <p className="text-sm text-[var(--muted)]">关闭后资料仍然展示，但不会鼓励新的申请。</p>
        </div>
      </label>

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "保存导师资料"}
      </button>
    </form>
  );
}
