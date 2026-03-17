import type { AccountRole } from "@/types/account";

export type TalentCard = {
  id: string;
  name: string;
  school: string;
  major: string;
  grade: string;
  bio: string;
  skills: string[];
  interestedDirections: string[];
  timeCommitment: string;
  avatarPath?: string | null;
  portfolioCoverPath?: string | null;
  portfolioExternalUrl?: string | null;
  isDemo?: boolean;
};

export type TalentDetail = TalentCard & {
  nickname?: string;
  experience: string;
  contact: string;
  achievements: string[];
  contactHint: string;
};

export type PersonalShowcase = {
  id: string;
  role: AccountRole;
  title: string;
  subtitle: string;
  summary: string;
  tags: string[];
  sections: Array<{
    label: string;
    value: string;
  }>;
  ctaLabel: string;
  editPath: string;
};
