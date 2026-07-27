import type { EmailAttachment } from "@/lib/types";

export function attachmentsFromJson(value: string): EmailAttachment[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as EmailAttachment[]) : [];
  } catch {
    return [];
  }
}

export function hasAttachmentsJson(value: string): boolean {
  return attachmentsFromJson(value).length > 0;
}

export function attachmentLabel(contentType: string, filename: string | null) {
  const ext = filename?.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 5) return ext;

  if (contentType.includes("pdf")) return "PDF";
  if (contentType.startsWith("image/")) return "IMG";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) {
    return "XLS";
  }
  if (contentType.includes("word") || contentType.includes("document")) {
    return "DOC";
  }
  if (contentType.includes("zip") || contentType.includes("compressed")) {
    return "ZIP";
  }
  if (contentType.startsWith("text/")) return "TXT";
  return "FILE";
}

export function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10.5 4.5 5.75 9.25a2.121 2.121 0 1 0 3 3L13 8a3.536 3.536 0 0 0-5-5L3.75 7.25a4.95 4.95 0 0 0 7 7L14.5 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
