"use client";

import { useState, useTransition } from "react";

import { saveCaseAction } from "@/app/actions";
import { scrollToFirstError } from "@/lib/form";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { initialActionState, type ActionState } from "@/types/action";
import { caseSchema } from "@/validators/case";

export function AdminCaseForm() {
  const [values, setValues] = useState({
    title: "",
    summary: "",
    resultTags: [""],
    relatedOpportunityId: "",
    coverPath: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const payload = {
      ...values,
      resultTags: values.resultTags.map((item) => item.trim()).filter(Boolean),
    };

    const parsed = caseSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "案例信息还没填完整，请按提示补充。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveCaseAction(initialActionState, formData);
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
      <label className="block space-y-2">
        <FieldLabel required>案例标题</FieldLabel>
        <input
          name="title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          className="field-base"
          placeholder="案例标题"
        />
        <FieldError message={fieldErrors.title} />
      </label>

      <label className="block space-y-2">
        <FieldLabel required>案例摘要</FieldLabel>
        <textarea
          name="summary"
          rows={4}
          value={values.summary}
          onChange={(event) => setValues((current) => ({ ...current, summary: event.target.value }))}
          className="field-base"
          placeholder="说明这个案例是怎么配队、落地、拿结果的。"
        />
        <FieldError message={fieldErrors.summary} />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel required>结果标签</FieldLabel>
          <button
            type="button"
            onClick={() => setValues((current) => ({ ...current, resultTags: [...current.resultTags, ""] }))}
            className="rounded-full border border-[rgba(17,40,79,0.12)] px-4 py-2 text-sm font-semibold"
          >
            添加标签
          </button>
        </div>
        <FieldError message={fieldErrors.resultTags} />
        {values.resultTags.map((value, index) => (
          <div key={`${index}-${values.resultTags.length}`} className="flex gap-3">
            <div className="flex-1">
              <input
                name="resultTags"
                value={value}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    resultTags: current.resultTags.map((tag, tagIndex) =>
                      tagIndex === index ? event.target.value : tag,
                    ),
                  }))
                }
                className="field-base"
                placeholder={`结果标签 ${index + 1}`}
              />
              <FieldError message={fieldErrors[`resultTags.${index}`]} />
            </div>
            {values.resultTags.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    resultTags: current.resultTags.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
                className="rounded-full px-4 text-sm font-semibold text-danger"
              >
                删除
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <label className="block space-y-2">
        <FieldLabel>关联招募 ID</FieldLabel>
        <input
          name="relatedOpportunityId"
          value={values.relatedOpportunityId}
          onChange={(event) => setValues((current) => ({ ...current, relatedOpportunityId: event.target.value }))}
          className="field-base"
          placeholder="可选，不填也可以"
        />
      </label>

      <label className="block space-y-2">
        <FieldLabel>案例封面外链</FieldLabel>
        <input
          name="coverPath"
          value={values.coverPath}
          onChange={(event) => setValues((current) => ({ ...current, coverPath: event.target.value }))}
          className="field-base"
          placeholder="https://..."
        />
        <FieldError message={fieldErrors.coverPath} />
      </label>

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "录入案例"}
      </button>
    </form>
  );
}
