"use client";

import { useState, useTransition } from "react";

import { saveMentorAction } from "@/app/actions";
import { mentorSupportScopes } from "@/constants";
import { scrollToFirstError } from "@/lib/form";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { initialActionState, type ActionState } from "@/types/action";
import { mentorSchema } from "@/validators/mentor";

const defaultDirectionTags = ["AI 工具", "机器人", "控制系统", "视觉传播", "学生项目", "实验室合作"];

export function AdminMentorForm() {
  const [values, setValues] = useState({
    name: "",
    organization: "",
    direction: "",
    directionTags: defaultDirectionTags,
    supportScope: [] as string[],
    contactMode: "",
    avatarPath: "",
    isOpen: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  function toggleSupportScope(item: string) {
    setValues((current) => ({
      ...current,
      supportScope: current.supportScope.includes(item)
        ? current.supportScope.filter((value) => value !== item)
        : [...current.supportScope, item],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const payload = {
      ...values,
      directionTags: values.directionTags.map((item) => item.trim()).filter(Boolean),
    };

    const parsed = mentorSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "导师信息还没填完整，请按提示补充" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveMentorAction(initialActionState, formData);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>导师姓名</FieldLabel>
          <input
            name="name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            className="field-base"
            placeholder="导师姓名"
          />
          <FieldError message={fieldErrors.name} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>组织信息</FieldLabel>
          <input
            name="organization"
            value={values.organization}
            onChange={(event) =>
              setValues((current) => ({ ...current, organization: event.target.value }))
            }
            className="field-base"
            placeholder="学院 / 实验室 / 工作室"
          />
          <FieldError message={fieldErrors.organization} />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel required>导师方向</FieldLabel>
        <textarea
          name="direction"
          rows={3}
          value={values.direction}
          onChange={(event) =>
            setValues((current) => ({ ...current, direction: event.target.value }))
          }
          className="field-base"
          placeholder="说明导师能提供什么方向支持"
        />
        <FieldError message={fieldErrors.direction} />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel required>方向标签</FieldLabel>
          <button
            type="button"
            onClick={() =>
              setValues((current) => ({ ...current, directionTags: [...current.directionTags, ""] }))
            }
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-2 text-sm font-semibold"
          >
            添加标签
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {values.directionTags.map((item, index) => (
            <div key={`${index}-${item || "tag"}`}>
              <input
                name="directionTags"
                value={item}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    directionTags: current.directionTags.map((tag, tagIndex) =>
                      tagIndex === index ? event.target.value : tag,
                    ),
                  }))
                }
                className="field-base"
                placeholder={`方向标签 ${index + 1}`}
              />
              <FieldError message={fieldErrors[`directionTags.${index}`]} />
            </div>
          ))}
        </div>
        <FieldError message={fieldErrors.directionTags} />
      </div>

      <div>
        <FieldLabel required>支持范围</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {mentorSupportScopes.map((item) => (
            <label
              key={item}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                values.supportScope.includes(item)
                  ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                  : "border-[rgba(17,40,79,0.12)] bg-white"
              }`}
            >
              <input
                type="checkbox"
                name="supportScope"
                value={item}
                checked={values.supportScope.includes(item)}
                onChange={() => toggleSupportScope(item)}
              />
              {item}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.supportScope} />
      </div>

      <label className="block space-y-2">
        <FieldLabel required>联系说明</FieldLabel>
        <input
          name="contactMode"
          value={values.contactMode}
          onChange={(event) =>
            setValues((current) => ({ ...current, contactMode: event.target.value }))
          }
          className="field-base"
          placeholder="例如：平台申请后统一联系"
        />
        <FieldError message={fieldErrors.contactMode} />
      </label>

      <label className="block space-y-2">
        <FieldLabel>导师头像外链</FieldLabel>
        <input
          name="avatarPath"
          value={values.avatarPath}
          onChange={(event) =>
            setValues((current) => ({ ...current, avatarPath: event.target.value }))
          }
          className="field-base"
          placeholder="https://..."
        />
        <FieldError message={fieldErrors.avatarPath} />
      </label>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
        <input
          type="checkbox"
          name="isOpen"
          checked={values.isOpen}
          onChange={(event) =>
            setValues((current) => ({ ...current, isOpen: event.target.checked }))
          }
        />
        当前开放申请
      </label>

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "录入导师"}
      </button>
    </form>
  );
}
