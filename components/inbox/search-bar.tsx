"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  formatOperator,
  operatorLabel,
  parseQuery,
  type SearchOperator,
} from "@/lib/search/parse-query";
import { applyDraft } from "@/lib/search/serialize-query";

type SearchBarProps = {
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  senderSuggestions?: string[];
  onQueryChange: (query: string) => void;
};

type Suggestion = {
  id: string;
  label: string;
  description: string;
  insert: string;
  complete: boolean;
};

const BASE_SUGGESTIONS: Suggestion[] = [
  {
    id: "from",
    label: "from:",
    description: "Filter by sender",
    insert: "from:",
    complete: false,
  },
  {
    id: "to",
    label: "to:",
    description: "Filter by recipient",
    insert: "to:",
    complete: false,
  },
  {
    id: "subject",
    label: "subject:",
    description: "Filter by subject",
    insert: "subject:",
    complete: false,
  },
  {
    id: "is-unread",
    label: "is:unread",
    description: "Unread only",
    insert: "is:unread",
    complete: true,
  },
  {
    id: "is-read",
    label: "is:read",
    description: "Read only",
    insert: "is:read",
    complete: true,
  },
  {
    id: "is-starred",
    label: "is:starred",
    description: "Starred only",
    insert: "is:starred",
    complete: true,
  },
  {
    id: "has-attachment",
    label: "has:attachment",
    description: "Has attachments",
    insert: "has:attachment",
    complete: true,
  },
  {
    id: "after",
    label: "after:",
    description: "After date (YYYY-MM-DD)",
    insert: "after:",
    complete: false,
  },
  {
    id: "before",
    label: "before:",
    description: "Before date (YYYY-MM-DD)",
    insert: "before:",
    complete: false,
  },
];

const HINT_KEY = "inbox-search-hint-dismissed";

function uniqueSenders(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    result.push(trimmed);
  }
  return result;
}

function dedupeOps(operators: SearchOperator[]): SearchOperator[] {
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

function FilterPopover({
  onAdd,
  onClose,
}: {
  onAdd: (operators: SearchOperator[]) => void;
  onClose: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [unread, setUnread] = useState(false);
  const [read, setRead] = useState(false);
  const [starred, setStarred] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onClose]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const operators: SearchOperator[] = [];
    if (from.trim()) operators.push({ kind: "from", value: from.trim() });
    if (to.trim()) operators.push({ kind: "to", value: to.trim() });
    if (subject.trim()) operators.push({ kind: "subject", value: subject.trim() });
    if (unread) operators.push({ kind: "is", value: "unread" });
    if (read) operators.push({ kind: "is", value: "read" });
    if (starred) operators.push({ kind: "is", value: "starred" });
    if (hasAttachment) operators.push({ kind: "has", value: "attachment" });
    if (/^\d{4}-\d{2}-\d{2}$/.test(after)) {
      operators.push({ kind: "after", value: after });
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(before)) {
      operators.push({ kind: "before", value: before });
    }
    onAdd(operators);
    onClose();
  }

  const fieldClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs max-sm:text-base dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-30 mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
    >
      <form onSubmit={submit} className="space-y-2.5">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          Add filters
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">From</span>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={fieldClass}
            placeholder="name or email"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">To</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={fieldClass}
            placeholder="name or email"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={fieldClass}
            placeholder="contains…"
          />
        </label>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-700 dark:text-zinc-300">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={unread}
              onChange={(e) => {
                setUnread(e.target.checked);
                if (e.target.checked) setRead(false);
              }}
            />
            Unread
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={read}
              onChange={(e) => {
                setRead(e.target.checked);
                if (e.target.checked) setUnread(false);
              }}
            />
            Read
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={starred}
              onChange={(e) => setStarred(e.target.checked)}
            />
            Starred
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={hasAttachment}
              onChange={(e) => setHasAttachment(e.target.checked)}
            />
            Has attachment
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">After</span>
            <input
              type="date"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Before</span>
            <input
              type="date"
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </form>
    </div>
  );
}

export function SearchBar({
  query,
  searchRef,
  senderSuggestions = [],
  onQueryChange,
}: SearchBarProps) {
  const listId = useId();
  const initial = parseQuery(query);
  const [chips, setChips] = useState<SearchOperator[]>(initial.operators);
  const [draft, setDraft] = useState(initial.freeText.join(" "));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(HINT_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  function emit(nextChips: SearchOperator[], nextDraft: string) {
    onQueryChange(applyDraft(nextChips, nextDraft));
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const suggestions = useMemo(() => {
    const needle = draft.trim().toLowerCase();
    const items: Suggestion[] = [];

    const fromMatch = draft.match(/^from:(.*)$/i);
    if (fromMatch) {
      const partial = fromMatch[1].replace(/^"/, "").toLowerCase();
      for (const sender of uniqueSenders(senderSuggestions).slice(0, 8)) {
        if (partial && !sender.toLowerCase().includes(partial)) continue;
        items.push({
          id: `sender-${sender}`,
          label: `from:${sender}`,
          description: "Sender",
          insert: formatOperator({ kind: "from", value: sender }),
          complete: true,
        });
      }
    }

    for (const suggestion of BASE_SUGGESTIONS) {
      if (
        !needle ||
        suggestion.label.startsWith(needle) ||
        suggestion.insert.startsWith(needle)
      ) {
        items.push(suggestion);
      }
    }

    const seen = new Set<string>();
    return items
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 10);
  }, [draft, senderSuggestions]);

  const safeActiveIndex =
    suggestions.length === 0
      ? 0
      : Math.min(activeIndex, suggestions.length - 1);

  function promoteDraftOperators(rawDraft: string) {
    const parsed = parseQuery(rawDraft);
    if (parsed.operators.length === 0) return false;
    const nextChips = dedupeOps([...chips, ...parsed.operators]);
    const nextDraft = parsed.freeText.join(" ");
    setChips(nextChips);
    setDraft(nextDraft);
    emit(nextChips, nextDraft);
    return true;
  }

  function onDraftChange(value: string) {
    setDraft(value);
    setActiveIndex(0);
    setOpen(true);
    // Live search includes typed operators, but chips stay until committed.
    emit(chips, value);
  }

  function applySuggestion(suggestion: Suggestion) {
    if (suggestion.complete) {
      const op = parseQuery(suggestion.insert).operators[0];
      if (!op) return;
      const nextChips = dedupeOps([...chips, op]);
      setChips(nextChips);
      setDraft("");
      emit(nextChips, "");
    } else {
      setDraft(suggestion.insert);
      emit(chips, suggestion.insert);
      searchRef.current?.focus();
    }
    setOpen(false);
  }

  function removeChip(index: number) {
    const nextChips = chips.filter((_, i) => i !== index);
    setChips(nextChips);
    emit(nextChips, draft);
  }

  function dismissHint() {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // ignore
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (filterOpen) {
        setFilterOpen(false);
        return;
      }
      if (open) {
        setOpen(false);
        return;
      }
      if (draft || chips.length) {
        setChips([]);
        setDraft("");
        onQueryChange("");
      }
      return;
    }

    if (event.key === "Backspace" && draft === "" && chips.length > 0) {
      event.preventDefault();
      removeChip(chips.length - 1);
      return;
    }

    if (event.key === "ArrowDown" && open && suggestions.length) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && open && suggestions.length) {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter" && open && suggestions[safeActiveIndex]) {
      event.preventDefault();
      applySuggestion(suggestions[safeActiveIndex]);
      return;
    }

    if (event.key === " " || event.key === "Tab") {
      const trimmed = draft.trim();
      if (!trimmed) return;
      const parsed = parseQuery(trimmed);
      if (parsed.operators.length > 0) {
        if (event.key === "Tab") event.preventDefault();
        // Space after a completed operator: promote chips, keep remaining free text.
        if (event.key === " ") {
          // Allow the space only when free text remains; otherwise prevent double space.
          event.preventDefault();
          const nextChips = dedupeOps([...chips, ...parsed.operators]);
          const nextDraft =
            parsed.freeText.length > 0 ? `${parsed.freeText.join(" ")} ` : "";
          setChips(nextChips);
          setDraft(nextDraft);
          emit(nextChips, nextDraft.trim());
        } else {
          promoteDraftOperators(trimmed);
        }
      }
    }
  }

  function onBlur() {
    promoteDraftOperators(draft);
    setOpen(false);
  }

  function onAddFilters(next: SearchOperator[]) {
    const nextChips = dedupeOps([...chips, ...next]);
    setChips(nextChips);
    emit(nextChips, draft);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-start gap-1">
        <div
          className="flex min-h-[38px] min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          onClick={() => searchRef.current?.focus()}
        >
          {chips.map((op, index) => (
            <span
              key={`${op.kind}-${op.value}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="truncate">{operatorLabel(op)}</span>
              <button
                type="button"
                aria-label={`Remove ${operatorLabel(op)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeChip(index);
                }}
                className="rounded px-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={searchRef}
            type="search"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onFocus={() => {
              setOpen(true);
            }}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={
              chips.length === 0 ? "Search or filter…" : "Add text or filter…"
            }
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            className="min-w-[6rem] flex-1 bg-transparent text-sm max-sm:text-base outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset focus-visible:outline-none"
          />
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Add filter"
            onClick={() => {
              setFilterOpen((value) => !value);
              setOpen(false);
            }}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-zinc-300 text-sm text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="4" y1="8" x2="12" y2="8" />
              <line x1="6" y1="12" x2="10" y2="12" />
            </svg>
          </button>
          {filterOpen ? (
            <FilterPopover
              onAdd={onAddFilters}
              onClose={() => setFilterOpen(false)}
            />
          ) : null}
        </div>
      </div>

      {showHint && open && chips.length === 0 && !draft ? (
        <p className="mt-1.5 flex items-center justify-between gap-2 text-xs text-zinc-500">
          <span>
            Try{" "}
            <code className="text-zinc-600 dark:text-zinc-400">
              from:alex is:unread
            </code>{" "}
            or use ⊕
          </span>
          <button
            type="button"
            onClick={dismissHint}
            className="shrink-0 text-zinc-400 hover:text-zinc-600"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-10 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === safeActiveIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySuggestion(suggestion)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm ${
                  index === safeActiveIndex
                    ? "bg-blue-600/10 text-zinc-900 dark:bg-blue-500/10 dark:text-zinc-100"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="font-medium">{suggestion.label}</span>
                <span className="truncate text-xs text-zinc-500">
                  {suggestion.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
