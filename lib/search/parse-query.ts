export type SearchOperatorKind =
  | "from"
  | "to"
  | "subject"
  | "has"
  | "is"
  | "after"
  | "before";

export type SearchOperator = {
  kind: SearchOperatorKind;
  value: string;
};

export type ParsedQuery = {
  operators: SearchOperator[];
  freeText: string[];
};

const KNOWN_KEYS = new Set<SearchOperatorKind>([
  "from",
  "to",
  "subject",
  "has",
  "is",
  "after",
  "before",
]);

const IS_VALUES = new Set(["unread", "read", "starred"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidOperator(kind: SearchOperatorKind, value: string): boolean {
  if (!value) return false;
  if (kind === "has") return value === "attachment";
  if (kind === "is") return IS_VALUES.has(value);
  if (kind === "after" || kind === "before") return DATE_RE.test(value);
  return true;
}

/** Tokenize a search string into operators and free-text terms. */
export function parseQuery(q: string): ParsedQuery {
  const operators: SearchOperator[] = [];
  const freeText: string[] = [];

  const trimmed = q.trim();
  if (!trimmed) return { operators, freeText };

  const re =
    /([a-zA-Z]+):(?:"([^"]*)"|(\S+))|"([^"]+)"|(\S+)/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(trimmed)) !== null) {
    if (match[1]) {
      const key = match[1].toLowerCase();
      const value = (match[2] ?? match[3] ?? "").trim();
      const raw = match[0];

      if (KNOWN_KEYS.has(key as SearchOperatorKind)) {
        const kind = key as SearchOperatorKind;
        if (isValidOperator(kind, value)) {
          operators.push({ kind, value });
          continue;
        }
      }

      freeText.push(raw);
      continue;
    }

    if (match[4]) {
      freeText.push(match[4]);
      continue;
    }

    if (match[5]) {
      freeText.push(match[5]);
    }
  }

  return { operators, freeText };
}

export function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function formatOperator(op: SearchOperator): string {
  return `${op.kind}:${quoteIfNeeded(op.value)}`;
}

export function operatorLabel(op: SearchOperator): string {
  return `${op.kind}: ${op.value}`;
}
