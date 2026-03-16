import { z } from "zod";

import { optionalUrlSchema } from "./shared";

export const applicationSchema = z.object({
  opportunityId: z.string().trim().min(1, "缺少机会 ID"),
  note: z.string().trim().min(10, "请至少写 10 个字的报名备注"),
  trialTaskUrl: optionalUrlSchema,
});
