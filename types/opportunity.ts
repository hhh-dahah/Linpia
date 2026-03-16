export const opportunityTypes = ["比赛组队", "项目招募", "导师机会", "短期协作"] as const;

export const opportunityStatuses = ["开放报名", "进行中", "已截止"] as const;

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
  schoolScope: string;
  deadline: string;
  skills: string[];
  status: OpportunityStatus;
  weeklyHours: string;
  applicantCount: number;
  creatorName: string;
  coverPath?: string | null;
  feishuUrl?: string | null;
  createdAt?: string;
};

export type OpportunityDetail = OpportunityCard & {
  progress: string;
  trialTask: string;
  deliverables: string[];
  roleGaps: RoleGap[];
};
