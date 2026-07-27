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
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
        <span>{state.label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="font-medium underline underline-offset-2"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-1.5 text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-900"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
