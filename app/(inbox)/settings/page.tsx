"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    id: "default",
    fromName: "",
    fromEmail: "",
    signatureHtml: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as { settings: Settings };
      setSettings(data.settings);
      setLoading(false);
    }
    void load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      setMessage("Failed to save settings");
      setSaving(false);
      return;
    }

    const data = (await response.json()) as { settings: Settings };
    setSettings(data.settings);
    setMessage("Settings saved");
    setSaving(false);
  }

  if (loading) {
    return <p className="p-6 text-sm text-zinc-500">Loading settings...</p>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure your sending identity and email signature.
          </p>
        </div>
        <Link
          href="/"
          className="motion-press rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          Back to inbox
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">From name</label>
            <input
              value={settings.fromName}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  fromName: event.target.value,
                }))
              }
              placeholder="Your Name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">From email</label>
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  fromEmail: event.target.value,
                }))
              }
              placeholder="you@yourdomain.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Signature HTML</label>
          <textarea
            value={settings.signatureHtml}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                signatureHtml: event.target.value,
              }))
            }
            rows={8}
            placeholder="<p>Best regards,<br/>Your Name</p>"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {settings.signatureHtml ? (
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-3 text-sm font-medium">Signature preview</p>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: settings.signatureHtml }}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="motion-press rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
          {message ? <span className="motion-fade-in text-sm text-zinc-500">{message}</span> : null}
        </div>
      </form>
    </main>
  );
}
