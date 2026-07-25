export function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeSnippet(html: string | null, text: string | null): string {
  const source = text?.trim() || (html ? stripHtml(html) : "");
  return source.slice(0, 120);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HTML_BLOCK_TAG =
  /<\/?(p|div|br|ul|ol|li|table|tr|td|blockquote|h[1-6]|pre|hr|img|a|span|strong|em|b|i)\b[^>]*>/i;

/** Turn a plain-text body (blank-line paragraphs, single-line breaks) into HTML. */
export function plainTextToHtml(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
}

/** Leave real HTML alone; convert plain text so formatting survives sending. */
export function normalizeBodyHtml(value: string): string {
  const body = value.trim();
  if (!body) return "";
  return HTML_BLOCK_TAG.test(body) ? body : plainTextToHtml(body);
}

export function ensureRePrefix(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

export function getHeader(
  headers: Record<string, string> | null | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === name.toLowerCase(),
  );
  return key ? headers[key] : undefined;
}
