const BANNED_PHRASES = [
  /^subject:\s*.+$/gim,
  /^from:\s*.+$/gim,
  /^to:\s*.+$/gim,
];

export function sanitizeDraft(text: string): string {
  let draft = text.trim();

  draft = draft.replace(/^```[\s\S]*?\n/g, "").replace(/\n```$/g, "");
  draft = draft.replace(/\u2014/g, "-").replace(/\u2013/g, "-");

  for (const pattern of BANNED_PHRASES) {
    draft = draft.replace(pattern, "");
  }

  return draft.replace(/\n{3,}/g, "\n\n").trim();
}
