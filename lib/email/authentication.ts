import { getHeader } from "@/lib/utils";

const DEFAULT_PROTECTED_DOMAINS = ["themuneebh.com"];

type InboundAuthenticationInput = {
  from: string;
  headers: Record<string, string> | null | undefined;
  protectedDomains?: readonly string[];
};

type DmarcResult =
  | "pass"
  | "fail"
  | "none"
  | "neutral"
  | "policy"
  | "temperror"
  | "permerror"
  | "missing"
  | "misaligned"
  | "unknown";

export type InboundAuthenticationVerdict =
  | { filter: false }
  | {
      filter: true;
      domain: string;
      dmarc: Exclude<DmarcResult, "pass">;
    };

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function getSenderDomain(from: string): string | null {
  const match = from.match(/@([^@<>\s]+)>?\s*$/);
  return match ? normalizeDomain(match[1]) : null;
}

function getAuthoritativeDmarcResult(
  headers: Record<string, string> | null | undefined,
  senderDomain: string,
): DmarcResult {
  const authenticationResults = getHeader(headers, "authentication-results");
  if (!authenticationResults) return "missing";

  const sesMarker = authenticationResults.toLowerCase().indexOf("amazonses.com;");
  if (sesMarker === -1) return "missing";

  const authoritativeResults = authenticationResults.slice(sesMarker);
  const dmarcSegment = authoritativeResults
    .split(";")
    .find((segment) => /\bdmarc=/i.test(segment));

  if (!dmarcSegment) return "missing";

  const rawResult = dmarcSegment
    .match(/\bdmarc=([^\s;]+)/i)?.[1]
    ?.toLowerCase();
  const result: DmarcResult =
    rawResult === "pass" ||
    rawResult === "fail" ||
    rawResult === "none" ||
    rawResult === "neutral" ||
    rawResult === "policy" ||
    rawResult === "temperror" ||
    rawResult === "permerror"
      ? rawResult
      : rawResult
        ? "unknown"
        : "missing";
  const authenticatedDomain = dmarcSegment
    .match(/\bheader\.from=([^\s;]+)/i)?.[1]
    ?.toLowerCase();

  if (result !== "pass") return result;
  return normalizeDomain(authenticatedDomain ?? "") === senderDomain
    ? "pass"
    : "misaligned";
}

export function getProtectedEmailDomains(): string[] {
  const configured = process.env.INBOX_PROTECTED_DOMAINS;
  if (!configured) return DEFAULT_PROTECTED_DOMAINS;

  return configured
    .split(",")
    .map(normalizeDomain)
    .filter(Boolean);
}

export function getInboundAuthenticationVerdict({
  from,
  headers,
  protectedDomains = getProtectedEmailDomains(),
}: InboundAuthenticationInput): InboundAuthenticationVerdict {
  const senderDomain = getSenderDomain(from);
  if (!senderDomain) return { filter: false };

  const protectedSet = new Set(protectedDomains.map(normalizeDomain));
  if (!protectedSet.has(senderDomain)) return { filter: false };

  const dmarc = getAuthoritativeDmarcResult(headers, senderDomain);
  return dmarc === "pass"
    ? { filter: false }
    : { filter: true, domain: senderDomain, dmarc };
}
