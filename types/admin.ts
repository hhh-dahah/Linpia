import type { AccountRole } from "@/types/account";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";
import {
  directoryPersonSources,
  type DirectoryPerson,
  type DirectoryPersonSource,
  visibilityStatuses,
  type VisibilityStatus,
} from "@/types/directory";
import type { OpportunityStatus, OpportunityType } from "@/types/opportunity";

export const adminRoles = ["super_admin", "operator"] as const;
export type AdminRole = (typeof adminRoles)[number];
export { directoryPersonSources, visibilityStatuses };
export type { DirectoryPerson, DirectoryPersonSource, VisibilityStatus };

export const adminApplicationStatuses = applicationStatuses;
export type AdminApplicationStatus = ApplicationStatus;

export type AdminUser = {
  id: string;
  userId: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  introduction: string;
  contact: string;
  proofUrl: string;
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
