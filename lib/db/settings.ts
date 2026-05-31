import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, type Settings } from "@/lib/db/schema";

const DEFAULT_ID = "default";

export async function getSettings(): Promise<Settings> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.id, DEFAULT_ID),
  });

  if (row) return row;

  const defaults: Settings = {
    id: DEFAULT_ID,
    fromName: "",
    fromEmail: "",
    signatureHtml: "",
  };

  await db.insert(settings).values(defaults).onConflictDoNothing();
  return defaults;
}

export async function updateSettings(input: {
  fromName: string;
  fromEmail: string;
  signatureHtml: string;
}): Promise<Settings> {
  await db
    .insert(settings)
    .values({
      id: DEFAULT_ID,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      signatureHtml: input.signatureHtml,
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        signatureHtml: input.signatureHtml,
      },
    });

  return getSettings();
}
