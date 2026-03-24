import type { AccountRole } from "@/types/account";

export const applicationStatuses = ["待查看", "已联系", "试合作中", "已录用", "未通过"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export type DashboardApplication = {
  id: string;
  opportunityTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
};

export type ManagedOpportunityApplication = {
  id: string;
  opportunityId: string;
  applicantId: string;
  applicantName: string;
  applicantRole: AccountRole | null;
  introduction: string;
  contact: string;
  proofUrl: string;
  status: ApplicationStatus;
  submittedAt: string;
};
