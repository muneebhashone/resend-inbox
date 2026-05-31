import { NextResponse } from "next/server";
import { syncReceivedEmails } from "@/lib/email/ingest";

export async function POST() {
  try {
    const result = await syncReceivedEmails();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
