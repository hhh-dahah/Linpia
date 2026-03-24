import { z } from "zod";

import { fileLikeSchema, optionalTextSchema, optionalUrlSchema } from "./shared";

const customTagSchema = z
  .string()
  .trim()
  .min(2, "自定义标签至少 2 个字")
  .max(10, "自定义标签最多 10 个字");

const baseSchema = z.object({
  role: z.enum(["student", "mentor"]),
  type: z.string().trim().min(1, "请选择招募类型"),
  title: z.string().trim().min(4, "标题至少 4 个字"),
  organization: z.string().trim().min(2, "请填写学校、团队或实验室"),
  summary: z.string().trim().min(12, "详细需求说明至少 12 个字"),
  deadline: z.string().trim().min(1, "请选择截止时间"),
  weeklyHours: z.string().trim().min(1, "请填写时间安排"),
  applicationRequirement: optionalTextSchema,
  contactInfo: z.string().trim().min(2, "请填写联系方式"),
  feishuUrl: optionalUrlSchema,
  presetTags: z.array(z.string()).optional().default([]),
  customTags: z.array(customTagSchema).max(5, "最多添加 5 个自定义标签").optional().default([]),
  cover: fileLikeSchema,
});

export const opportunitySchema = z.discriminatedUnion("role", [
  baseSchema.extend({
    role: z.literal("student"),
    projectName: z.string().trim().min(2, "请填写项目或比赛名称"),
  }),
  baseSchema.extend({
    role: z.literal("mentor"),
    researchDirection: z.string().trim().min(2, "请填写研究或指导方向"),
    targetAudience: z.string().trim().min(2, "请填写面向对象"),
    supportMethod: z.string().trim().min(2, "请填写支持方式"),
  }),
]);
