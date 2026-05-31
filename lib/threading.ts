export function computeThreadId(
  messageId: string,
  inReplyTo?: string | null,
  references?: string | null,
): string {
  const refIds = parseMessageIds(references);
  if (refIds.length > 0) return refIds[0];
  if (inReplyTo?.trim()) return inReplyTo.trim();
  return messageId;
}

export function parseMessageIds(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const matches = value.match(/<[^>]+>/g);
  if (matches?.length) return matches;
  return value.trim().split(/\s+/).filter(Boolean);
}

export function buildReferences(
  existingReferences: string | null | undefined,
  parentMessageId: string,
): string {
  const refs = parseMessageIds(existingReferences);
  if (!refs.includes(parentMessageId)) {
    refs.push(parentMessageId);
  }
  return refs.join(" ");
}

export function generateMessageId(fromEmail: string): string {
  const domain = fromEmail.split("@")[1] ?? "localhost";
  return `<${crypto.randomUUID()}@${domain}>`;
}
