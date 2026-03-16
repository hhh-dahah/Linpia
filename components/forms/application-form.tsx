"use client";

import { useState, useTransition } from "react";

import { applyOpportunityAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { scrollToFirstError } from "@/lib/form";
import { initialActionState, type ActionState } from "@/types/action";
import { applicationSchema } from "@/validators/application";

export function ApplicationForm({ opportunityId }: { opportunityId: string }) {
  const [values, setValues] = useState({
    note: "",
    trialTaskUrl: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const payload = {
      opportunityId,
      note: values.note,
      trialTaskUrl: values.trialTaskUrl,
    };

    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "报名信息还不完整，请按提示补充。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await applyOpportunityAction(initialActionState, formData);
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
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <label className="block space-y-2">
        <FieldLabel required>报名备注</FieldLabel>
        <textarea
          name="note"
          rows={4}
          value={values.note}
          onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
          placeholder="简单介绍你的经历、可投入时间，以及为什么适合这个招募。"
          className="field-base"
        />
        <FieldError message={fieldErrors.note} />
      </label>
      <label className="block space-y-2">
        <FieldLabel>试合作链接</FieldLabel>
        <input
          name="trialTaskUrl"
          value={values.trialTaskUrl}
          onChange={(event) =>
            setValues((current) => ({ ...current, trialTaskUrl: event.target.value }))
          }
          placeholder="https://..."
          className="field-base"
        />
        <FieldError message={fieldErrors.trialTaskUrl} />
      </label>
      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "提交中..." : "立即报名"}
      </button>
    </form>
  );
}
