import { Suspense } from "react";

import MatchResultClient from "./MatchResultClient";

const Loading = () => (
  <main className="min-h-screen bg-base-100 px-6 py-10 text-base-content">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="rounded-brand border border-base-300 bg-base-200/60 p-3 shadow-sm">
        <div className="h-32 animate-pulse rounded-brand bg-base-200/80" />
      </section>
    </div>
  </main>
);

export default function MatchResultPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MatchResultClient />
    </Suspense>
  );
}
