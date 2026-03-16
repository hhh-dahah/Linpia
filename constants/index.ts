import { opportunityTypes } from "@/types/opportunity";

export const siteNavigation = [
  { href: "/opportunities", label: "找队伍" },
  { href: "/publish", label: "发招募" },
  { href: "/profile", label: "展示技能" },
] as const;

export const schools = [
  "兰州交通大学",
  "兰州大学",
  "兰州理工大学",
  "西北师范大学",
  "兰州财经大学",
] as const;

export const skillOptions = [
  "前端",
  "后端",
  "产品",
  "设计",
  "算法",
  "数据分析",
  "新媒体",
  "运营",
  "答辩",
  "硬件",
] as const;

export const timeCommitmentOptions = [
  "每周 3-5 小时",
  "每周 6-10 小时",
  "每周 10-15 小时",
  "每周 15 小时以上",
] as const;

export const mentorSupportScopes = [
  "方向建议",
  "项目拆解",
  "资源背书",
  "实验室机会",
  "比赛指导",
] as const;

export const mentorSupportMethods = [
  "线上答疑",
  "周期指导",
  "项目评审",
  "实验室协作",
  "资源对接",
] as const;

export const recruitmentTagPresets = [
  "数学建模",
  "互联网+",
  "AI",
  "前端",
  "后端",
  "设计",
  "答辩",
  "科研",
  "运营",
  "机械/硬件",
] as const;

export const studentDirectionOptions = [
  "比赛组队",
  "项目招募",
  "短期合作",
  "导师带队",
] as const;

export { opportunityTypes };
