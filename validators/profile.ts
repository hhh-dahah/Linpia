import { z } from "zod";

import { fileLikeSchema, optionalTextSchema, optionalUrlSchema } from "./shared";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "请填写姓名或昵称"),
  school: optionalTextSchema,
  major: optionalTextSchema,
  grade: optionalTextSchema,
  bio: optionalTextSchema,
  skillTags: z.array(z.string()).optional().default([]),
  customSkills: z
    .array(z.string().trim().min(2, "自定义技能需要 2-10 个字").max(10, "自定义技能需要 2-10 个字"))
    .optional()
    .default([])
    .transform((items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))])
    .pipe(z.array(z.string()).max(5, "自定义技能最多添加 5 个")),
  interestedDirections: z.array(z.string()).optional().default([]),
  timeCommitment: optionalTextSchema,
  portfolioExternalUrl: optionalUrlSchema,
  experience: optionalTextSchema,
  contact: z.string().trim().min(2, "请填写联系方式，方便别人联系你"),
  avatar: fileLikeSchema,
  portfolioCover: fileLikeSchema,
});
