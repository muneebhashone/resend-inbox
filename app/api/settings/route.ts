import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    fromName?: string;
    fromEmail?: string;
    signatureHtml?: string;
  };

  const settings = await updateSettings({
    fromName: body.fromName ?? "",
    fromEmail: body.fromEmail ?? "",
    signatureHtml: body.signatureHtml ?? "",
  });

  return NextResponse.json({ settings });
}
