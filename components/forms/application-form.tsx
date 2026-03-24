"use client";

import { useState, useTransition } from "react";

import { applyOpportunityAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { scrollToFirstError } from "@/lib/form";
import { initialActionState, type ActionState } from "@/types/action";
import {
  applicationRequiredItemLabels,
  type ApplicationRequiredItem,
} from "@/types/opportunity";
import { createApplicationSchema } from "@/validators/application";

type ApplicationFormProps = {
  opportunityId: string;
  requiredItems?: ApplicationRequiredItem[];
  requirementNote?: string;
};

type ApplicationFormState = {
  contact: string;
  intro: string;
  portfolioLink: string;
  projectExperience: string;
  proofMaterial: string;
  resumeLink: string;
  githubPortfolio: string;
  availability: string;
};

const defaultValues: ApplicationFormState = {
  contact: "",
  intro: "",
  portfolioLink: "",
  projectExperience: "",
  proofMaterial: "",
  resumeLink: "",
  githubPortfolio: "",
  availability: "",
};

const fieldOrder: ApplicationRequiredItem[] = [
  "intro",
  "portfolio_link",
  "project_experience",
  "proof_material",
  "resume_link",
  "github_portfolio",
  "availability",
];

export function ApplicationForm({
  opportunityId,
  requiredItems = [],
  requirementNote,
}: ApplicationFormProps) {
  const [values, setValues] = useState<ApplicationFormState>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  const visibleItems = fieldOrder.filter((item) => requiredItems.includes(item));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const payload = {
      opportunityId,
      contact: values.contact,
      intro: values.intro,
      portfolioLink: values.portfolioLink,
      projectExperience: values.projectExperience,
      proofMaterial: values.proofMaterial,
      resumeLink: values.resumeLink,
      githubPortfolio: values.githubPortfolio,
      availability: values.availability,
    };

    const parsed = createApplicationSchema({ requiredItems }).safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "报名信息还没填完整，请按提示补充。" });
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

      {requirementNote ? (
        <div className="rounded-2xl bg-[rgba(36,107,250,0.06)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          其他要求：{requirementNote}
        </div>
      ) : null}

      {visibleItems.includes("intro") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.intro}</FieldLabel>
          <textarea
            name="intro"
            rows={4}
            value={values.intro}
            onChange={(event) => setValues((current) => ({ ...current, intro: event.target.value }))}
            placeholder="简单介绍你自己、相关经历，以及为什么适合这次合作。"
            className="field-base"
          />
          <FieldError message={fieldErrors.intro} />
        </label>
      ) : null}

      <label className="block space-y-2">
        <FieldLabel required>联系方式</FieldLabel>
        <input
          name="contact"
          value={values.contact}
          onChange={(event) => setValues((current) => ({ ...current, contact: event.target.value }))}
          placeholder="例如微信号、手机号，或平台内联系说明"
          className="field-base"
        />
        <FieldError message={fieldErrors.contact} />
      </label>

      {visibleItems.includes("portfolio_link") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.portfolio_link}</FieldLabel>
          <input
            name="portfolioLink"
            value={values.portfolioLink}
            onChange={(event) => setValues((current) => ({ ...current, portfolioLink: event.target.value }))}
            placeholder="https://..."
            className="field-base"
          />
          <FieldError message={fieldErrors.portfolioLink} />
        </label>
      ) : null}

      {visibleItems.includes("project_experience") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.project_experience}</FieldLabel>
          <textarea
            name="projectExperience"
            rows={3}
            value={values.projectExperience}
            onChange={(event) =>
              setValues((current) => ({ ...current, projectExperience: event.target.value }))
            }
            placeholder="写一下你做过什么项目、负责过什么。"
            className="field-base"
          />
          <FieldError message={fieldErrors.projectExperience} />
        </label>
      ) : null}

      {visibleItems.includes("proof_material") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.proof_material}</FieldLabel>
          <textarea
            name="proofMaterial"
            rows={3}
            value={values.proofMaterial}
            onChange={(event) => setValues((current) => ({ ...current, proofMaterial: event.target.value }))}
            placeholder="可以填写证书、获奖、论文、作品说明等。"
            className="field-base"
          />
          <FieldError message={fieldErrors.proofMaterial} />
        </label>
      ) : null}

      {visibleItems.includes("resume_link") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.resume_link}</FieldLabel>
          <input
            name="resumeLink"
            value={values.resumeLink}
            onChange={(event) => setValues((current) => ({ ...current, resumeLink: event.target.value }))}
            placeholder="https://..."
            className="field-base"
          />
          <FieldError message={fieldErrors.resumeLink} />
        </label>
      ) : null}

      {visibleItems.includes("github_portfolio") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.github_portfolio}</FieldLabel>
          <input
            name="githubPortfolio"
            value={values.githubPortfolio}
            onChange={(event) =>
              setValues((current) => ({ ...current, githubPortfolio: event.target.value }))
            }
            placeholder="https://github.com/... 或作品集链接"
            className="field-base"
          />
          <FieldError message={fieldErrors.githubPortfolio} />
        </label>
      ) : null}

      {visibleItems.includes("availability") ? (
        <label className="block space-y-2">
          <FieldLabel required>{applicationRequiredItemLabels.availability}</FieldLabel>
          <input
            name="availability"
            value={values.availability}
            onChange={(event) => setValues((current) => ({ ...current, availability: event.target.value }))}
            placeholder="例如每周 6-8 小时 / 晚上可投入"
            className="field-base"
          />
          <FieldError message={fieldErrors.availability} />
        </label>
      ) : null}

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
