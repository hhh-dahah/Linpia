import type { AccountRole } from "@/types/account";
import type { OpportunityStatus, OpportunityType } from "@/types/opportunity";

export const adminRoles = ["super_admin", "operator"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const directoryPersonSources = ["registered", "managed"] as const;
export type DirectoryPersonSource = (typeof directoryPersonSources)[number];

export const visibilityStatuses = ["active", "hidden", "archived"] as const;
export type VisibilityStatus = (typeof visibilityStatuses)[number];

export const adminApplicationStatuses = ["待查看", "沟通中", "已通过", "未通过"] as const;
export type AdminApplicationStatus = (typeof adminApplicationStatuses)[number];

export type AdminUser = {
  id: string;
  userId: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPerson = {
  id: string;
  authUserId?: string | null;
  source: DirectoryPersonSource;
  role: AccountRole;
  name: string;
  school: string;
  major: string;
  grade: string;
  college: string;
  lab: string;
  bio: string;
  skills: string[];
  interestedDirections: string[];
  researchDirection: string;
  supportTypes: string[];
  supportMethod: string;
  openStatus: boolean;
  contact: string;
  avatarPath?: string | null;
  portfolioUrl?: string | null;
  visibilityStatus: VisibilityStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type AdminOpportunity = {
  id: string;
  title: string;
  summary: string;
  type: OpportunityType;
  status: OpportunityStatus;
  visibilityStatus: VisibilityStatus;
  creatorRole: AccountRole;
  creatorName: string;
  organization: string;
  applicantCount: number;
  deadline: string;
  createdAt: string;
};

export type AdminApplication = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  applicantId: string;
  applicantName: string;
  applicantRole: AccountRole | null;
  note: string;
  trialTaskUrl: string;
  status: AdminApplicationStatus;
  createdAt: string;
};

export type AdminDashboardSnapshot = {
  peopleCount: number;
  activeOpportunityCount: number;
  pendingApplicationCount: number;
  recentPeople: DirectoryPerson[];
  recentOpportunities: AdminOpportunity[];
  recentApplications: AdminApplication[];
};
