import type { AccountRole } from "@/types/account";

export const directoryPersonSources = ["registered", "managed"] as const;
export type DirectoryPersonSource = (typeof directoryPersonSources)[number];

export const visibilityStatuses = ["active", "hidden", "archived"] as const;
export type VisibilityStatus = (typeof visibilityStatuses)[number];

export type ContactAvailability = "available" | "limited" | "hidden";

export type ProfileTrustInfo = {
  completenessPercent: number;
  completenessLabel: string;
  updatedText: string;
  contactAvailability: ContactAvailability;
  contactText: string;
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
  customSkills?: string[];
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
  trustInfo?: ProfileTrustInfo;
};
