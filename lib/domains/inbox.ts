import type { AccountRole } from "@/types/account";
import type { ApplicationStatus } from "@/types/application";
import { getApplicationStatusDescription, getApplicationStatusLabel } from "@/lib/domains/status";
import {
  appendConversationMessage,
  createNotificationEvent,
  ensureConversationThread,
} from "@/lib/repositories/inbox";

type InboxClient = Parameters<typeof ensureConversationThread>[0];

export async function notifyApplicationCreated(
  client: InboxClient,
  payload: {
    applicationId: string;
    opportunityId: string;
    opportunityTitle: string;
    publisherId: string;
    publisherRole: AccountRole | null;
    applicantId: string;
    applicantRole: AccountRole | null;
    applicantName: string;
  },
) {
  const threadId = await ensureConversationThread(client, payload);

  await createNotificationEvent(client, {
    recipientId: payload.publisherId,
    type: "application_received",
    title: "收到新的报名申请",
    body: `${payload.applicantName} 已报名「${payload.opportunityTitle}」。`,
    linkHref: `/dashboard/opportunities/${payload.opportunityId}`,
  });

  return threadId;
}

export async function notifyApplicationStatusChanged(
  client: InboxClient,
  payload: {
    applicationId: string;
    opportunityId: string;
    opportunityTitle: string;
    publisherId: string;
    publisherRole: AccountRole | null;
    applicantId: string;
    applicantRole: AccountRole | null;
    status: ApplicationStatus;
  },
) {
  const threadId = await ensureConversationThread(client, payload);
  const statusLabel = getApplicationStatusLabel(payload.status);

  await createNotificationEvent(client, {
    recipientId: payload.applicantId,
    type: "application_status_changed",
    title: "报名状态已更新",
    body: `你在「${payload.opportunityTitle}」中的报名状态已变为「${statusLabel}」。`,
    linkHref: `/dashboard/applications/${payload.applicationId}`,
  });

  if (threadId) {
    await appendConversationMessage(client, {
      threadId,
      senderId: payload.publisherId,
      body: `系统状态同步：${statusLabel}。${getApplicationStatusDescription(payload.status)}`,
    });
  }

  return threadId;
}

export async function notifyConversationMessage(
  client: InboxClient,
  payload: {
    threadId: string;
    senderId: string;
    recipientId: string;
    senderName: string;
    opportunityTitle: string;
    body: string;
  },
) {
  const body = payload.body.trim();
  if (!body) {
    return;
  }

  await appendConversationMessage(client, {
    threadId: payload.threadId,
    senderId: payload.senderId,
    body,
  });

  await createNotificationEvent(client, {
    recipientId: payload.recipientId,
    type: "conversation_message",
    title: "你收到一条新的站内消息",
    body: `${payload.senderName} 在「${payload.opportunityTitle}」中发来新消息。`,
    linkHref: `/dashboard/conversations/${payload.threadId}`,
  });
}
