export type CaseCard = {
  id: string;
  title: string;
  summary: string;
  resultTags: string[];
  coverPath?: string | null;
  relatedOpportunityId?: string | null;
};
