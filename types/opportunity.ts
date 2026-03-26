import type { AccountRole } from "@/types/account";

export const opportunityTypes = ["比赛组队", "项目招募", "导师带队", "短期合作"] as const;

export const opportunityStatuses = ["开放申请", "进行中", "已截止"] as const;

export const applicationRequiredItems = [
  "intro",
  "portfolio_link",
  "project_experience",
  "proof_material",
  "resume_link",
  "github_portfolio",
  "availability",
] as const;

export type OpportunityType = (typeof opportunityTypes)[number];
export type OpportunityStatus = (typeof opportunityStatuses)[number];
export type ApplicationRequiredItem = (typeof applicationRequiredItems)[number];

export const applicationRequiredItemLabels: Record<ApplicationRequiredItem, string> = {
  intro: "自我介绍",
  portfolio_link: "作品链接",
  project_experience: "项目经历",
  proof_material: "证明材料",
  resume_link: "简历链接",
  github_portfolio: "GitHub / 作品集",
  availability: "可投入时间",
};

export type OpportunityCard = {
  id: string;
  type: OpportunityType;
  title: string;
  summary: string;
  organization: string;
  deadline: string;
  tags: string[];
  status: OpportunityStatus;
  weeklyHours: string;
  applicantCount: number;
  creatorId?: string;
  creatorName: string;
  creatorRole: AccountRole;
  creatorRoleLabel: string;
  creatorOrganization: string;
  projectName: string;
  coverPath?: string | null;
  feishuUrl?: string | null;
  createdAt?: string;
  isDemo?: boolean;
};

export type OpportunityDetail = OpportunityCard & {
  progress: string;
  trialTask: string;
  supplementaryItems: string[];
  applicationRequiredItems?: ApplicationRequiredItem[];
  applicationRequirementNote?: string;
};
