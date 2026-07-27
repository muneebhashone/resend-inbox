"use client";

import { useEffect } from "react";

export type KeyboardHandlers = {
  onNext: () => void;
  onPrev: () => void;
  onOpen: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onUnread: () => void;
  onStar: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onCompose: () => void;
  onSearch: () => void;
  onEscape: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useInboxKeyboard(handlers: KeyboardHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") {
          handlers.onEscape();
        }
        return;
      }

      switch (event.key) {
        case "j":
          event.preventDefault();
          handlers.onNext();
          break;
        case "k":
          event.preventDefault();
          handlers.onPrev();
          break;
        case "Enter":
        case "o":
          event.preventDefault();
          handlers.onOpen();
          break;
        case "e":
          event.preventDefault();
          handlers.onArchive();
          break;
        case "#":
          event.preventDefault();
          handlers.onTrash();
          break;
        case "u":
          event.preventDefault();
          handlers.onUnread();
          break;
        case "s":
          event.preventDefault();
          handlers.onStar();
          break;
        case "r":
          event.preventDefault();
          handlers.onReply();
          break;
        case "a":
          event.preventDefault();
          handlers.onReplyAll();
          break;
        case "c":
          event.preventDefault();
          handlers.onCompose();
          break;
        case "/":
          event.preventDefault();
          handlers.onSearch();
          break;
        case "Escape":
          event.preventDefault();
          handlers.onEscape();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, enabled]);
}
