import { z } from "zod";

import type { ApplicationRequiredItem } from "@/types/opportunity";

import { optionalUrlSchema } from "./shared";

const optionalTextField = z.string().trim().optional().or(z.literal(""));
const optionalUrlField = optionalUrlSchema;

type ApplicationSchemaOptions = {
  requiredItems?: ApplicationRequiredItem[];
};

export function createApplicationSchema(options: ApplicationSchemaOptions = {}) {
  const requiredItems = new Set(options.requiredItems ?? []);

  return z
    .object({
      opportunityId: z.string().trim().min(1, "缺少招募 ID"),
      contact: z.string().trim().min(2, "请填写联系方式"),
      intro: optionalTextField,
      portfolioLink: optionalUrlField,
      projectExperience: optionalTextField,
      proofMaterial: optionalTextField,
      resumeLink: optionalUrlField,
      githubPortfolio: optionalUrlField,
      availability: optionalTextField,
    })
    .superRefine((value, ctx) => {
      if (requiredItems.has("intro") && (value.intro ?? "").trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["intro"],
          message: "请至少写 10 个字的自我介绍",
        });
      }

      if (requiredItems.has("portfolio_link") && !value.portfolioLink) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["portfolioLink"],
          message: "请填写作品链接",
        });
      }

      if (requiredItems.has("project_experience") && (value.projectExperience ?? "").trim().length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["projectExperience"],
          message: "请补充项目经历",
        });
      }

      if (requiredItems.has("proof_material") && (value.proofMaterial ?? "").trim().length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proofMaterial"],
          message: "请补充证明材料",
        });
      }

      if (requiredItems.has("resume_link") && !value.resumeLink) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["resumeLink"],
          message: "请填写简历链接",
        });
      }

      if (requiredItems.has("github_portfolio") && !value.githubPortfolio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["githubPortfolio"],
          message: "请填写 GitHub / 作品集链接",
        });
      }

      if (requiredItems.has("availability") && (value.availability ?? "").trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["availability"],
          message: "请填写可投入时间",
        });
      }
    });
}
