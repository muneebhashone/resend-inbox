"use client";

import type { EmailAction } from "@/lib/types";

export type UndoState = {
  label: string;
  threadIds: string[];
  undoAction: EmailAction;
};

type UndoToastProps = {
  state: UndoState | null;
  onUndo: () => void;
  onDismiss: () => void;
};

export function UndoToast({ state, onUndo, onDismiss }: UndoToastProps) {
  if (!state) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div className="motion-slide-up pointer-events-auto flex max-w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <span className="min-w-0 truncate">{state.label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex min-h-9 shrink-0 items-center font-medium text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="relative inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded px-2 py-1 text-zinc-400 hover:text-zinc-800 before:absolute before:-inset-1 before:content-[''] dark:hover:text-zinc-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
