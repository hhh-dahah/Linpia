import type { AccountRole } from "@/types/account";

export const conversationStatuses = ["open", "closed"] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];

export type ConversationThread = {
  id: string;
  applicationId: string;
  opportunityId: string;
  opportunityTitle: string;
  counterpartId: string;
  counterpartName: string;
  counterpartRole: AccountRole | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  status: ConversationStatus;
  unreadCount: number;
};

export type ConversationMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: AccountRole | null;
  body: string;
  createdAt: string;
  isMine: boolean;
};

export type ConversationThreadDetail = {
  thread: ConversationThread;
  messages: ConversationMessage[];
};
