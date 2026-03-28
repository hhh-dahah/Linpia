import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountRole } from "@/types/account";
import type {
  ConversationMessage,
  ConversationThread,
  ConversationThreadDetail,
} from "@/types/conversation";
import type { NotificationEvent, NotificationEventType } from "@/types/notification";

type DbClient = SupabaseClient;
type RecordMap = Record<string, unknown>;

type EnsureConversationThreadPayload = {
  applicationId: string;
  opportunityId: string;
  opportunityTitle: string;
  publisherId: string;
  publisherRole: AccountRole | null;
  applicantId: string;
  applicantRole: AccountRole | null;
};

type CreateNotificationPayload = {
  recipientId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  linkHref: string;
};

function normalizeThread(
  row: RecordMap,
  userId: string,
  profileMap: Map<string, RecordMap>,
  unreadCount = 0,
): ConversationThread {
  const participantOneId = String(row.participant_one_id ?? "");
  const participantTwoId = String(row.participant_two_id ?? "");
  const counterpartId = participantOneId === userId ? participantTwoId : participantOneId;
  const counterpart = profileMap.get(counterpartId);

  return {
    id: String(row.id ?? ""),
    applicationId: String(row.application_id ?? ""),
    opportunityId: String(row.opportunity_id ?? ""),
    opportunityTitle: String(row.opportunity_title ?? "未命名招募"),
    counterpartId,
    counterpartName: String(counterpart?.nickname ?? counterpart?.name ?? "未命名用户"),
    counterpartRole: (counterpart?.role as AccountRole | null) ?? null,
    lastMessagePreview: String(row.last_message_preview ?? ""),
    lastMessageAt: String(row.last_message_at ?? row.updated_at ?? row.created_at ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    status: String(row.status ?? "open") === "closed" ? "closed" : "open",
    unreadCount,
  };
}

function normalizeMessage(
  row: RecordMap,
  userId: string,
  profileMap: Map<string, RecordMap>,
): ConversationMessage {
  const senderId = String(row.sender_id ?? "");
  const sender = profileMap.get(senderId);

  return {
    id: String(row.id ?? ""),
    threadId: String(row.thread_id ?? ""),
    senderId,
    senderName: String(sender?.nickname ?? sender?.name ?? "未命名用户"),
    senderRole: (sender?.role as AccountRole | null) ?? null,
    body: String(row.body ?? ""),
    createdAt: String(row.created_at ?? ""),
    isMine: senderId === userId,
  };
}

async function listProfilesByIds(client: DbClient, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) {
    return new Map<string, RecordMap>();
  }

  const { data } = await client.from("profiles").select("id, name, nickname, role").in("id", uniqueIds);
  return new Map((data ?? []).map((item) => [String(item.id), item as RecordMap]));
}

export async function ensureConversationThread(client: DbClient, payload: EnsureConversationThreadPayload) {
  try {
    const baseRecord = {
      application_id: payload.applicationId,
      opportunity_id: payload.opportunityId,
      opportunity_title: payload.opportunityTitle,
      participant_one_id: payload.publisherId,
      participant_one_role: payload.publisherRole,
      participant_two_id: payload.applicantId,
      participant_two_role: payload.applicantRole,
      status: "open",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("conversation_threads")
      .upsert(baseRecord, { onConflict: "application_id" })
      .select("id")
      .maybeSingle();

    if (error) {
      if (/relation .*conversation_threads.* does not exist/i.test(error.message)) {
        return null;
      }
      throw error;
    }

    return String(data?.id ?? "");
  } catch {
    return null;
  }
}

export async function appendConversationMessage(
  client: DbClient,
  params: { threadId: string; senderId: string; body: string },
) {
  try {
    const now = new Date().toISOString();
    const insert = await client
      .from("conversation_messages")
      .insert({
        thread_id: params.threadId,
        sender_id: params.senderId,
        body: params.body,
      })
      .select("id")
      .maybeSingle();

    if (insert.error) {
      if (/relation .*conversation_messages.* does not exist/i.test(insert.error.message)) {
        return null;
      }
      throw insert.error;
    }

    await client
      .from("conversation_threads")
      .update({
        last_message_preview: params.body.slice(0, 120),
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", params.threadId);

    return String(insert.data?.id ?? "");
  } catch {
    return null;
  }
}

export async function createNotificationEvent(client: DbClient, payload: CreateNotificationPayload) {
  try {
    const { error } = await client.from("notification_events").insert({
      recipient_id: payload.recipientId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link_href: payload.linkHref,
      is_read: false,
    });

    if (error && !/relation .*notification_events.* does not exist/i.test(error.message)) {
      throw error;
    }
  } catch {
    return;
  }
}

export async function listConversationThreadsForUser(
  client: DbClient,
  userId: string,
  limit = 10,
): Promise<ConversationThread[]> {
  try {
    const { data, error } = await client
      .from("conversation_threads")
      .select("*")
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/relation .*conversation_threads.* does not exist/i.test(error.message)) {
        return [];
      }
      throw error;
    }

    const rows = (data ?? []) as RecordMap[];
    const participantIds = rows.flatMap((row) => [
      String(row.participant_one_id ?? ""),
      String(row.participant_two_id ?? ""),
    ]);
    const profileMap = await listProfilesByIds(client, participantIds);

    const { data: unreadRows } = await client
      .from("notification_events")
      .select("thread_id")
      .eq("recipient_id", userId)
      .eq("is_read", false);
    const unreadCountMap = new Map<string, number>();
    (unreadRows ?? []).forEach((item) => {
      const threadId = String((item as RecordMap).thread_id ?? "");
      if (threadId) {
        unreadCountMap.set(threadId, (unreadCountMap.get(threadId) ?? 0) + 1);
      }
    });

    return rows.map((row) =>
      normalizeThread(row, userId, profileMap, unreadCountMap.get(String(row.id ?? "")) ?? 0),
    );
  } catch {
    return [];
  }
}

export async function getConversationThreadDetailForUser(
  client: DbClient,
  threadId: string,
  userId: string,
): Promise<ConversationThreadDetail | null> {
  try {
    const { data: thread, error } = await client
      .from("conversation_threads")
      .select("*")
      .eq("id", threadId)
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
      .maybeSingle();

    if (error) {
      if (/relation .*conversation_threads.* does not exist/i.test(error.message)) {
        return null;
      }
      throw error;
    }

    if (!thread) {
      return null;
    }

    const { data: messages } = await client
      .from("conversation_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    const participantIds = [
      String((thread as RecordMap).participant_one_id ?? ""),
      String((thread as RecordMap).participant_two_id ?? ""),
      ...((messages ?? []) as RecordMap[]).map((item) => String(item.sender_id ?? "")),
    ];
    const profileMap = await listProfilesByIds(client, participantIds);

    const normalizedThread = normalizeThread(thread as RecordMap, userId, profileMap);
    const normalizedMessages = ((messages ?? []) as RecordMap[]).map((item) =>
      normalizeMessage(item, userId, profileMap),
    );

    return {
      thread: normalizedThread,
      messages: normalizedMessages,
    };
  } catch {
    return null;
  }
}

export async function listNotificationEventsForUser(
  client: DbClient,
  userId: string,
  limit = 8,
): Promise<NotificationEvent[]> {
  try {
    const { data, error } = await client
      .from("notification_events")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/relation .*notification_events.* does not exist/i.test(error.message)) {
        return [];
      }
      throw error;
    }

    return ((data ?? []) as RecordMap[]).map((item) => ({
      id: String(item.id ?? ""),
      recipientId: String(item.recipient_id ?? ""),
      type: String(item.type ?? "conversation_message") as NotificationEventType,
      title: String(item.title ?? ""),
      body: String(item.body ?? ""),
      linkHref: String(item.link_href ?? "/dashboard"),
      isRead: Boolean(item.is_read ?? false),
      createdAt: String(item.created_at ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function markNotificationRead(client: DbClient, notificationId: string, userId: string) {
  try {
    const { error } = await client
      .from("notification_events")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("recipient_id", userId);

    if (error && !/relation .*notification_events.* does not exist/i.test(error.message)) {
      throw error;
    }
  } catch {
    return;
  }
}
