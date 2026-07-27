import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type EmailDirection = "inbound" | "outbound";

export type EmailAttachment = {
  id: string;
  filename: string | null;
  contentType: string;
  downloadUrl?: string;
};

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  resendId: text("resend_id").notNull().unique(),
  direction: text("direction").notNull().$type<EmailDirection>(),
  threadId: text("thread_id").notNull(),
  messageId: text("message_id").notNull(),
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  from: text("from").notNull(),
  to: text("to").notNull(),
  cc: text("cc").notNull().default("[]"),
  bcc: text("bcc").notNull().default("[]"),
  subject: text("subject").notNull(),
  html: text("html"),
  text: text("text"),
  snippet: text("snippet").notNull().default(""),
  attachments: text("attachments").notNull().default("[]"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  fromName: text("from_name").notNull().default(""),
  fromEmail: text("from_email").notNull().default(""),
  signatureHtml: text("signature_html").notNull().default(""),
});

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Settings = typeof settings.$inferSelect;
