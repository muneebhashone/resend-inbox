import { Suspense } from "react";
import { LoginForm } from "./page-client";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-lg shadow-black/5 backdrop-blur-md sm:p-8 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:shadow-black/30">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Resend Inbox</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to read and reply to your emails.
        </p>
        <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
