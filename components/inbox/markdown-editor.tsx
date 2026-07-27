"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { looksLikeMarkdown, markdownToHtml, wrapSelection } from "@/lib/markdown";
import { sanitizeHtml } from "@/lib/sanitize";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onSubmit?: () => void;
  className?: string;
};

type ViewMode = "write" | "preview" | "split";

function ToolbarButton({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your message in Markdown…",
  disabled,
  rows = 10,
  textareaRef: externalRef,
  onSubmit,
  className = "",
}: MarkdownEditorProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
  const [mode, setMode] = useState<ViewMode>("write");
  const [pasteHint, setPasteHint] = useState("");
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  function showHint(message: string) {
    setPasteHint(message);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setPasteHint(""), 2800);
  }

  function applyWrap(before: string, after?: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = wrapSelection(value, start, end, before, after);
    onChange(next.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData("text/plain");
    if (!pasted || !looksLikeMarkdown(pasted)) return;

    event.preventDefault();
    const el = event.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const cleaned = pasted.replace(/\r\n/g, "\n").trim();
    const next = `${value.slice(0, start)}${cleaned}${value.slice(end)}`;
    onChange(next);
    showHint("Markdown detected — formatted for preview");
    setMode((current) => (current === "write" ? "split" : current));

    requestAnimationFrame(() => {
      const cursor = start + cleaned.length;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyWrap("**");
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      applyWrap("*");
    }
  }

  const previewHtml = sanitizeHtml(markdownToHtml(value || ""));

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${className}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
        <div className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {(["write", "split", "preview"] as ViewMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded px-2 py-1 text-[11px] font-medium capitalize ${
                mode === item
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {mode !== "preview" ? (
          <>
            <div className="mx-1 hidden h-4 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
            <ToolbarButton label="B" title="Bold (⌘B)" onClick={() => applyWrap("**")} disabled={disabled} />
            <ToolbarButton label="I" title="Italic (⌘I)" onClick={() => applyWrap("*")} disabled={disabled} />
            <ToolbarButton label="<>" title="Code" onClick={() => applyWrap("`")} disabled={disabled} />
            <ToolbarButton label="Link" title="Link" onClick={() => applyWrap("[", "](url)")} disabled={disabled} />
            <ToolbarButton
              label="List"
              title="Bullet list"
              onClick={() => applyWrap("- ", "")}
              disabled={disabled}
            />
          </>
        ) : null}

        <span className="ml-auto text-[10px] text-zinc-400">Markdown</span>
      </div>

      {pasteHint ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {pasteHint}
        </div>
      ) : null}

      <div
        className={`grid min-h-0 flex-1 ${
          mode === "split" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {mode !== "preview" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            className={`min-h-[140px] w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] leading-relaxed outline-none disabled:opacity-50 ${
              mode === "split" ? "border-b border-zinc-200 sm:border-b-0 sm:border-r dark:border-zinc-800" : ""
            }`}
          />
        ) : null}

        {mode !== "write" ? (
          <div className="min-h-[140px] overflow-y-auto px-3 py-2">
            {value.trim() ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-zinc-400">Nothing to preview yet</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
