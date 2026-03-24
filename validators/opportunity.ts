import { z } from "zod";

import { applicationRequiredItems } from "@/types/opportunity";

import { fileLikeSchema, optionalTextSchema, optionalUrlSchema } from "./shared";

const customTagSchema = z
  .string()
  .trim()
  .min(2, "自定义标签至少 2 个字")
  .max(10, "自定义标签最多 10 个字");

const requiredItemSchema = z.enum(applicationRequiredItems);

export const opportunitySchema = z.object({
  role: z.enum(["student", "mentor"]),
  type: z.string().trim().min(1, "请选择招募类型"),
  title: z.string().trim().min(4, "招募标题至少 4 个字"),
  projectName: z.string().trim().min(2, "请填写项目 / 比赛名称"),
  summary: z.string().trim().min(12, "详细需求说明至少 12 个字"),
  contactInfo: z.string().trim().min(2, "请填写联系方式"),
  organization: optionalTextSchema,
  deadline: optionalTextSchema,
  weeklyHours: optionalTextSchema,
  feishuUrl: optionalUrlSchema,
  presetTags: z.array(z.string()).optional().default([]),
  customTags: z.array(customTagSchema).max(5, "最多添加 5 个自定义标签").optional().default([]),
  cover: fileLikeSchema,
  applicationRequiredItems: z.array(requiredItemSchema).optional().default([]),
  applicationRequirementNote: optionalTextSchema,
});
