import { Suspense } from "react";
import { LoginForm } from "./page-client";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-2 text-2xl font-semibold">Resend Inbox</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Sign in to read and reply to your emails.
        </p>
        <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
