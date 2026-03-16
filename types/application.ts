export type ApplicationStatus = "待查看" | "已联系" | "试合作中" | "已录用" | "未通过";

export type DashboardApplication = {
  id: string;
  opportunityTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
};
