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
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 shadow-xl shadow-black/40">
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
          className="rounded px-1.5 text-zinc-400 hover:text-zinc-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
