import { z } from "zod";

import { optionalUrlSchema } from "./shared";

export const caseSchema = z.object({
  title: z.string().trim().min(6, "请填写案例标题"),
  summary: z.string().trim().min(20, "案例摘要至少 20 个字"),
  resultTags: z.array(z.string()).min(1, "至少填写 1 个结果标签"),
  relatedOpportunityId: z.string().trim().optional(),
  coverPath: optionalUrlSchema,
});
