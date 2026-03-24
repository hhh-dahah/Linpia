import type { AccountRole } from "@/types/account";

export const applicationStatuses = ["待查看", "已联系", "试合作中", "已录用", "未通过"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationSubmissionPayload = {
  intro?: string;
  portfolioLink?: string;
  projectExperience?: string;
  proofMaterial?: string;
  resumeLink?: string;
  githubPortfolio?: string;
  availability?: string;
};

export type DashboardApplication = {
  id: string;
  opportunityId: string;
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
  projectExperience: string;
  proofMaterial: string;
  resumeLink: string;
  githubPortfolio: string;
  availability: string;
  submissionPayload: ApplicationSubmissionPayload;
  status: ApplicationStatus;
  submittedAt: string;
};
