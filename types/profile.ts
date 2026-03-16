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
};

export type TalentDetail = TalentCard & {
  achievements: string[];
  contactHint: string;
};
