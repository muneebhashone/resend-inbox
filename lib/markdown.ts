import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const MARKDOWN_SIGNALS = [
  /^#{1,6}\s+\S/m,
  /(\*\*|__)[\s\S]+?\1/,
  /(^|\s)(\*|_)[^*\n]+?\2(\s|$)/,
  /`[^`\n]+`/,
  /^```[\s\S]*?```/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s+\S/m,
  /^\s*>\s+\S/m,
  /\[[^\]]+\]\([^)]+\)/,
  /^\|.+\|/m,
  /^---+$/m,
];

export function looksLikeMarkdown(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (/<[a-z][\s\S]*>/i.test(text) && !text.includes("```")) return false;

  let hits = 0;
  for (const pattern of MARKDOWN_SIGNALS) {
    if (pattern.test(text)) hits += 1;
    if (hits >= 1 && text.includes("\n")) return true;
    if (hits >= 2) return true;
  }

  // Single strong signal on one line (e.g. **bold** only)
  return hits >= 1 && (text.length > 8 || text.includes("\n"));
}

export function markdownToHtml(markdown: string): string {
  const source = markdown.trim();
  if (!source) return "";

  const result = marked.parse(source, { async: false });
  return typeof result === "string" ? result.trim() : "";
}

const HTML_BLOCK_TAG =
  /<\/?(p|div|br|ul|ol|li|table|tr|td|blockquote|h[1-6]|pre|hr|img|a|span|strong|em|b|i)\b[^>]*>/i;

/** Convert markdown (or plain text) to email HTML; leave real HTML alone. */
export function bodyToEmailHtml(value: string): string {
  const body = value.trim();
  if (!body) return "";
  if (HTML_BLOCK_TAG.test(body) && !looksLikeMarkdown(body)) return body;
  return markdownToHtml(body);
}

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string = before,
) {
  const selected = value.slice(start, end) || "text";
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  return {
    value: next,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
}
