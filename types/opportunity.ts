import type { AccountRole } from "@/types/account";

export const opportunityTypes = ["比赛组队", "项目招募", "导师带队", "短期合作"] as const;

export const opportunityStatuses = ["开放申请", "进行中", "已截止"] as const;

export type OpportunityType = (typeof opportunityTypes)[number];
export type OpportunityStatus = (typeof opportunityStatuses)[number];

export type RoleGap = {
  id: string;
  roleName: string;
  responsibility: string;
  requirements: string;
  headcount: number;
  weeklyHours: string;
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
  coverPath?: string | null;
  feishuUrl?: string | null;
  createdAt?: string;
  roleSummary: string[];
};

export type OpportunityDetail = OpportunityCard & {
  progress: string;
  trialTask: string;
  supplementaryItems: string[];
  roleGaps: RoleGap[];
};
