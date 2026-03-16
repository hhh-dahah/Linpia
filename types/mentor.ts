export type MentorCard = {
  id: string;
  name: string;
  organization: string;
  direction: string;
  directionTags: string[];
  supportScope: string[];
  avatarPath?: string | null;
  contactMode: string;
  isOpen: boolean;
};
