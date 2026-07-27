import { and, eq, gte, like, lt, ne, or, type SQL } from "drizzle-orm";
import { emails } from "@/lib/db/schema";
import {
  parseQuery,
  type ParsedQuery,
  type SearchOperator,
} from "@/lib/search/parse-query";

function likePattern(value: string): string {
  return `%${value}%`;
}

function startOfLocalDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function conditionForOperator(op: SearchOperator): SQL | undefined {
  switch (op.kind) {
    case "from":
      return like(emails.from, likePattern(op.value));
    case "to":
      return like(emails.to, likePattern(op.value));
    case "subject":
      return like(emails.subject, likePattern(op.value));
    case "has":
      return op.value === "attachment"
        ? ne(emails.attachments, "[]")
        : undefined;
    case "is":
      if (op.value === "unread") return eq(emails.isRead, false);
      if (op.value === "read") return eq(emails.isRead, true);
      if (op.value === "starred") return eq(emails.isStarred, true);
      return undefined;
    case "after":
      return gte(emails.createdAt, startOfLocalDay(op.value));
    case "before":
      return lt(emails.createdAt, startOfLocalDay(op.value));
    default:
      return undefined;
  }
}

function conditionForFreeText(term: string): SQL | undefined {
  const pattern = likePattern(term);
  return or(
    like(emails.subject, pattern),
    like(emails.from, pattern),
    like(emails.snippet, pattern),
  );
}

/** Build a Drizzle WHERE clause from a parsed search query. */
export function buildSearchFilter(
  parsed: ParsedQuery,
): SQL | undefined {
  const conditions: SQL[] = [];

  for (const op of parsed.operators) {
    const condition = conditionForOperator(op);
    if (condition) conditions.push(condition);
  }

  for (const term of parsed.freeText) {
    const condition = conditionForFreeText(term);
    if (condition) conditions.push(condition);
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/** Parse a raw `q` string and build the search filter in one step. */
export function buildSearchFilterFromQuery(q: string): SQL | undefined {
  const trimmed = q.trim();
  if (!trimmed) return undefined;
  return buildSearchFilter(parseQuery(trimmed));
}
