# Checkup Report — Resend Inbox

**Date**: 2026-07-27  
**Mode**: checkup  
**Score**: 35/60

---

## Six Vital Signs

| # | Vital Sign | Score | Status | Key Finding |
|---|---|---|---|---|
| 1 | Intentionality | 5/10 | Watch | Warm palette is authored, but typeface and layout are framework defaults |
| 2 | Readability | 5/10 | Watch | 11px text used in 18+ places; below comfortable reading minimum |
| 3 | Usability | 10/10 | Healthy | Full keyboard nav, undo, sophisticated search, all states handled |
| 4 | Responsiveness | 5/10 | Watch | Inputs at text-sm (14px) trigger iOS Safari auto-zoom on focus |
| 5 | Speed | 10/10 | Healthy | Optimistic UI, skeletons, background polling, efficient build |
| 6 | Accessibility | 0/10 | Critical | Zero visible focus indicators — keyboard users are left blind |

---

## TL;DR

The interface is well-built functionally — keyboard shortcuts, undo, search filters, all the right states. But it ships with a critical accessibility gap: no visible focus rings anywhere. Three `outline-none` instances on core inputs leave keyboard-only users unable to see where they are. This blocks shipping confidence regardless of how nice the palette looks.

**Primary fix**: Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` to every interactive element, especially the search input, compose inputs, and markdown textarea.

---

## What's Working

- **Full keyboard navigation** — j/k movement, single-key actions (e archive, r reply, c compose), Escape for back. Better than most email clients.
- **Optimistic UI** — thread actions update instantly with undo support. Feels fast and forgiving.
- **State coverage** — loading skeletons, empty states, error messages, disabled states all present. No "blank screen" moments.
- **Search system** — filter chips with operator suggestions. Sophisticated for an email client.
- **Warm palette** — the amber/sienna accent and stone neutrals feel deliberate and break from the generic azure-blue SaaS default.

---

## Priority Issues

### P0 — No visible focus indicators

Every text input uses `outline-none` with no replacement focus style. The search input (`search-bar.tsx:544`), compose recipient inputs (`compose-modal.tsx:377`), and markdown textarea (`markdown-editor.tsx:194`) all strip the browser's default focus ring. Keyboard users tabbing through the interface get zero visual feedback about which element is focused. This is a WCAG 2.4.7 violation.

**Fix**: Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none` to every interactive element. Replace bare `outline-none` with this pattern universally.

### P1 — iOS Safari input zoom

All `<input>`, `<textarea>`, and `type="search"` elements use `text-sm` (14px) or smaller. iOS Safari auto-zooms the viewport when any form element below 16px receives focus, breaking the layout. Affected: search input, compose To/Cc/Bcc/Subject, reply composer fields, markdown textarea (13px), AI draft input, filter popover fields.

**Fix**: On screens under 640px, bump form element font-size to `text-base` (16px). Use `max-sm:text-base` on all inputs and textareas. Never use `maximum-scale=1` to suppress zoom.

### P2 — 11px text is too small

Thread list snippets, dates, filter labels, and meta text use `text-[11px]` (18 occurrences across the codebase). On high-DPI screens this renders at ~8.5 physical pixels — below the threshold where letterforms remain distinguishable. The unread badge uses `text-[10px]`.

**Fix**: Bump all body-like text to at least `text-xs` (12px). Keep `text-[10px]` only for the unread badge (acceptable as a decorative element with sufficient contrast).

---

## Recommended Next Commands

- `/design interaction` — add focus rings and improve affordances
- `/design responsive` — fix iOS input zoom across all form elements
- `/design typeset` — establish a proper type scale so nothing needs 10-11px
