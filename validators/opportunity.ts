import { z } from "zod";

import { fileLikeSchema, optionalTextSchema, optionalUrlSchema } from "./shared";

const roleSchema = z.object({
  roleName: z.string().trim().min(2, "请填写角色名称"),
  responsibility: z.string().trim().min(6, "请填写角色职责"),
  requirements: z.string().trim().min(6, "请填写角色要求"),
  headcount: z.coerce.number().int().min(1, "至少招募 1 人"),
  weeklyHours: z.string().trim().min(1, "请填写每周投入"),
});

export const opportunitySchema = z.object({
  type: z.string().trim().min(1, "请选择机会类型"),
  title: z.string().trim().min(6, "标题至少 6 个字"),
  summary: z.string().trim().min(20, "摘要至少 20 个字"),
  schoolScope: z.string().trim().min(2, "请填写学校范围"),
  deadline: z.string().trim().min(1, "请选择截止时间"),
  weeklyHours: z.string().trim().min(1, "请填写建议投入"),
  progress: z.string().trim().min(6, "请填写当前进度"),
  trialTask: optionalTextSchema,
  feishuUrl: optionalUrlSchema.refine((value) => !value || value.includes("http"), "请输入有效链接"),
  skillTags: z.array(z.string()).optional().default([]),
  deliverables: z.array(z.string().trim().min(1, "交付项不能为空")).optional().default([]),
  roles: z.array(roleSchema).min(1, "至少添加 1 个角色缺口"),
  cover: fileLikeSchema,
});
