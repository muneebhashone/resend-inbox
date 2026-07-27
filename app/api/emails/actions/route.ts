import { NextResponse } from "next/server";
import { applyThreadAction } from "@/lib/email/actions";
import type { EmailAction } from "@/lib/types";

const ACTIONS = new Set<EmailAction>([
  "archive",
  "unarchive",
  "trash",
  "restore",
  "star",
  "unstar",
  "read",
  "unread",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    threadIds?: string[];
    action?: EmailAction;
  };

  const threadIds = body.threadIds ?? [];
  const action = body.action;

  if (!action || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!Array.isArray(threadIds) || threadIds.length === 0) {
    return NextResponse.json({ error: "threadIds required" }, { status: 400 });
  }

  const result = await applyThreadAction(threadIds, action);
  return NextResponse.json(result);
}
