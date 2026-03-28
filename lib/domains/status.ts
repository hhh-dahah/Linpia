import { applicationStatuses, type ApplicationStatus } from "@/types/application";
import { visibilityStatuses, type VisibilityStatus } from "@/types/directory";
import { opportunityStatuses, type OpportunityStatus } from "@/types/opportunity";

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  开放申请: "开放申请",
  进行中: "进行中",
  已截止: "已截止",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  待查看: "待查看",
  已联系: "已联系",
  试合作中: "试合作中",
  已录用: "已录用",
  未通过: "未通过",
};

export const applicationStatusDescriptions: Record<ApplicationStatus, string> = {
  待查看: "发起方还没有处理这条报名。",
  已联系: "发起方已经开始沟通这条报名。",
  试合作中: "双方正在试合作或进一步确认。",
  已录用: "这条报名已经通过，可以继续推进合作。",
  未通过: "这条报名暂时没有进入下一步。",
};

export const visibilityStatusLabels: Record<VisibilityStatus, string> = {
  active: "展示中",
  hidden: "已隐藏",
  archived: "已归档",
};

export function getApplicationStatusLabel(status: ApplicationStatus) {
  return applicationStatusLabels[status] ?? status;
}

export function getApplicationStatusDescription(status: ApplicationStatus) {
  return applicationStatusDescriptions[status] ?? "状态已更新。";
}

export function getOpportunityStatusLabel(status: OpportunityStatus) {
  return opportunityStatusLabels[status] ?? status;
}

export function getVisibilityStatusLabel(status: VisibilityStatus) {
  return visibilityStatusLabels[status] ?? status;
}

export function isValidApplicationStatus(value: string): value is ApplicationStatus {
  return applicationStatuses.includes(value as ApplicationStatus);
}

export function isValidOpportunityStatus(value: string): value is OpportunityStatus {
  return opportunityStatuses.includes(value as OpportunityStatus);
}

export function isValidVisibilityStatus(value: string): value is VisibilityStatus {
  return visibilityStatuses.includes(value as VisibilityStatus);
}
