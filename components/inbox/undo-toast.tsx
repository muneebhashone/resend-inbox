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
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="motion-slide-up pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <span>{state.label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="relative rounded px-2 py-1 text-zinc-400 hover:text-zinc-100 before:absolute before:-inset-1 before:content-['']"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
