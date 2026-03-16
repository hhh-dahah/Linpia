import { z } from "zod";

export const fileLikeSchema = z.custom<File | null | undefined>(
  (value) =>
    value === null ||
    value === undefined ||
    (typeof value === "object" && value !== null && "size" in value && "name" in value),
  "文件格式无效",
);

export const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^https?:\/\//.test(value), "请输入有效链接");

export const optionalTextSchema = z.string().trim().optional().or(z.literal(""));
