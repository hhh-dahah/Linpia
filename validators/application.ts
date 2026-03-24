import { z } from "zod";

import { optionalUrlSchema } from "./shared";

export const applicationSchema = z.object({
  opportunityId: z.string().trim().min(1, "缺少招募 ID"),
  note: z.string().trim().min(10, "请至少写 10 个字的自我介绍"),
  contact: z.string().trim().min(2, "请填写联系方式"),
  proofUrl: optionalUrlSchema,
});
