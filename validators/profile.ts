import { z } from "zod";

import { fileLikeSchema, optionalTextSchema, optionalUrlSchema } from "./shared";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "请填写姓名或昵称"),
  school: optionalTextSchema,
  major: optionalTextSchema,
  grade: optionalTextSchema,
  bio: optionalTextSchema,
  skillTags: z.array(z.string()).optional().default([]),
  interestedDirections: z.array(z.string()).optional().default([]),
  timeCommitment: optionalTextSchema,
  portfolioExternalUrl: optionalUrlSchema,
  experience: optionalTextSchema,
  contact: optionalTextSchema,
  avatar: fileLikeSchema,
  portfolioCover: fileLikeSchema,
});
