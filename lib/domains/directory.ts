import { formatDate } from "@/lib/utils";
import type { ProfileTrustInfo } from "@/types/directory";
import type { MentorCard } from "@/types/mentor";
import type { TalentDetail } from "@/types/profile";

function toPercent(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function getCompletenessLabel(percent: number) {
  if (percent >= 85) {
    return "资料完整度高";
  }
  if (percent >= 60) {
    return "资料基本完整";
  }
  return "资料待补充";
}

function getContactText(hasContact: boolean) {
  return hasContact ? "已提供联系信息" : "仅资料展示";
}

export function buildTalentTrustInfo(item: TalentDetail): ProfileTrustInfo {
  let score = 0;
  const skills = [...item.skills, ...(item.customSkills ?? [])].filter(Boolean);

  if (item.bio.trim()) score += 3;
  if (skills.length) score += 3;
  if (item.interestedDirections.filter(Boolean).length) score += 2;
  if (item.experience.trim()) score += 2;
  if (item.portfolioExternalUrl?.trim()) score += 1;
  if (item.contact.trim()) score += 1;

  const completenessPercent = toPercent(score, 12);
  const hasContact = Boolean(item.contact.trim());

  return {
    completenessPercent,
    completenessLabel: getCompletenessLabel(completenessPercent),
    updatedText: item.updatedAt ? `最近更新：${formatDate(item.updatedAt)}` : "最近更新：待补充",
    contactAvailability: hasContact ? "available" : "limited",
    contactText: getContactText(hasContact),
  };
}

export function buildMentorTrustInfo(item: MentorCard): ProfileTrustInfo {
  let score = 0;

  if (item.direction.trim()) score += 3;
  if (item.supportScope.filter(Boolean).length) score += 2;
  if ([item.school, item.college, item.lab, item.organization].filter(Boolean).length) score += 2;
  if (item.supportMethod?.trim()) score += 2;
  if (item.applicationNotes?.trim()) score += 1;
  if (item.contactMode.trim()) score += 2;

  const completenessPercent = toPercent(score, 12);
  const hasContact = Boolean(item.contactMode.trim());

  return {
    completenessPercent,
    completenessLabel: getCompletenessLabel(completenessPercent),
    updatedText: item.updatedAt ? `最近更新：${formatDate(item.updatedAt)}` : "最近更新：待补充",
    contactAvailability: hasContact ? "available" : "limited",
    contactText: getContactText(hasContact),
  };
}
