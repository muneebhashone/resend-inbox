import { Suspense } from "react";
import { InboxApp } from "@/components/inbox/inbox-app";

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Loading inbox...
        </div>
      }
    >
      <InboxApp />
    </Suspense>
  );
}
