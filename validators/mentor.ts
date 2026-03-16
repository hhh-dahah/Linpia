import { z } from "zod";

import { optionalTextSchema } from "./shared";

export const mentorSchema = z.object({
  name: z.string().trim().min(2, "请填写导师姓名"),
  school: optionalTextSchema,
  college: optionalTextSchema,
  lab: optionalTextSchema,
  organization: z.string().trim().min(2, "请填写学校、学院或实验室"),
  direction: z.string().trim().min(4, "请填写研究方向"),
  directionTags: z.array(z.string()).optional().default([]),
  supportScope: z.array(z.string()).min(1, "至少选择 1 个可支持内容"),
  supportMethod: z.string().trim().min(2, "请填写支持方式"),
  contactMode: z.string().trim().min(2, "请填写联系方式或平台沟通方式"),
  applicationNotes: optionalTextSchema,
  isOpen: z.boolean(),
});
