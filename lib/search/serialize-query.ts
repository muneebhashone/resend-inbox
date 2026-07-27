import {
  formatOperator,
  parseQuery,
  type ParsedQuery,
  type SearchOperator,
} from "./parse-query";

function dedupeOperators(operators: SearchOperator[]): SearchOperator[] {
  const seen = new Set<string>();
  const result: SearchOperator[] = [];
  for (const op of operators) {
    const key = `${op.kind}:${op.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(op);
  }
  return result;
}

/** Rebuild a query string from structured parts. */
export function serializeQuery(parsed: ParsedQuery): string {
  const parts = [
    ...dedupeOperators(parsed.operators).map(formatOperator),
    ...parsed.freeText,
  ];
  return parts.join(" ").trim();
}

/**
 * Merge sticky operator chips with a draft input (which may contain new
 * operators and free text). Returns the full query string.
 */
export function applyDraft(
  chipOperators: SearchOperator[],
  draft: string,
): string {
  const fromDraft = parseQuery(draft);
  return serializeQuery({
    operators: [...chipOperators, ...fromDraft.operators],
    freeText: fromDraft.freeText,
  });
}

/** Free-text portion of a query, for the trailing input. */
export function draftFreeText(query: string): string {
  return parseQuery(query).freeText.join(" ");
}

export function removeOperatorAt(query: string, index: number): string {
  const parsed = parseQuery(query);
  if (index < 0 || index >= parsed.operators.length) return query;
  parsed.operators.splice(index, 1);
  return serializeQuery(parsed);
}

export function addOperator(query: string, operator: SearchOperator): string {
  const parsed = parseQuery(query);
  parsed.operators.push(operator);
  return serializeQuery(parsed);
}

export function removeOperatorKind(
  query: string,
  kind: SearchOperator["kind"],
  value?: string,
): string {
  const parsed = parseQuery(query);
  parsed.operators = parsed.operators.filter((op) => {
    if (op.kind !== kind) return true;
    if (value === undefined) return false;
    return op.value !== value;
  });
  return serializeQuery(parsed);
}

export function replaceOperators(
  query: string,
  operators: SearchOperator[],
): string {
  const { freeText } = parseQuery(query);
  return serializeQuery({ operators, freeText });
}
