export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <section className="w-full max-w-4xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm sm:p-12">
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
              Task 1 Scaffold
            </p>
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">
              Health Management App
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
              The Next.js foundation is ready for upcoming work on health
              records, coaching flows, and personalized care features.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "App Router structure under src/app",
              "Supabase and validation dependencies installed",
              "Vitest and Playwright scripts prepared",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
