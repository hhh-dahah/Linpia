import { z } from "zod";

import { optionalUrlSchema } from "./shared";

export const mentorSchema = z.object({
  name: z.string().trim().min(2, "请填写导师姓名"),
  organization: z.string().trim().min(2, "请填写组织信息"),
  direction: z.string().trim().min(6, "请填写导师方向"),
  directionTags: z.array(z.string()).min(1, "至少填写 1 个方向标签"),
  supportScope: z.array(z.string()).min(1, "至少选择 1 个支持范围"),
  contactMode: z.string().trim().min(4, "请填写联系说明"),
  avatarPath: optionalUrlSchema,
  isOpen: z.boolean(),
});
