export const notificationEventTypes = [
  "application_received",
  "application_status_changed",
  "conversation_message",
] as const;

export type NotificationEventType = (typeof notificationEventTypes)[number];

export type NotificationEvent = {
  id: string;
  recipientId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  linkHref: string;
  isRead: boolean;
  createdAt: string;
};
