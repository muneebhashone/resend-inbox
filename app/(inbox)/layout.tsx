import Link from "next/link";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link href="/" className="text-lg font-semibold">
          Resend Inbox
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/settings"
            className="rounded-md px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Settings
          </Link>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
