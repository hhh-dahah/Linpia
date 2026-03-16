import { opportunityTypes } from "@/types/opportunity";

export const siteNavigation = [
  { href: "/", label: "首页" },
  { href: "/opportunities", label: "找机会" },
  { href: "/talent", label: "找搭子" },
  { href: "/mentors", label: "找导师" },
  { href: "/cases", label: "看案例" },
  { href: "/publish", label: "发布机会" },
] as const;

export const schools = ["兰州交通大学", "兰州大学", "兰州理工大学", "西北师范大学", "兰州财经大学"] as const;

export const skillOptions = [
  "前端开发",
  "后端开发",
  "产品策划",
  "硬件调试",
  "算法建模",
  "UI 设计",
  "视频剪辑",
  "新媒体运营",
  "嵌入式",
  "视觉识别",
] as const;

export const timeCommitmentOptions = [
  "每周 3-5 小时",
  "每周 6-10 小时",
  "每周 10-15 小时",
  "每周 15 小时以上",
] as const;

export const mentorSupportScopes = ["方向建议", "项目拆解", "资源背书", "实验室机会", "比赛指导"] as const;

export { opportunityTypes };
