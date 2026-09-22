export type EmailAttachment = {
  id: string;
  filename: string | null;
  contentType: string;
  downloadUrl?: string;
};

export type Email = {
  id: string;
  resendId: string;
  direction: "inbound" | "outbound";
  threadId: string;
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string | null;
  text: string | null;
  snippet: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export type InboxView = "inbox" | "sent" | "starred" | "archived";

export type ThreadSummary = {
  threadId: string;
  id: string;
  subject: string;
  from: string;
  to: string[];
  snippet: string;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  unreadCount: number;
  messageCount: number;
  direction: "inbound" | "outbound";
};

export type EmailAction =
  | "archive"
  | "unarchive"
  | "trash"
  | "restore"
  | "star"
  | "unstar"
  | "read"
  | "unread";

export type Settings = {
  id: string;
  fromName: string;
  fromEmail: string;
  signatureHtml: string;
};
