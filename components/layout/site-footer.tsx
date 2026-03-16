export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-[var(--line)] bg-[rgba(255,255,255,0.72)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-[var(--foreground)]">Match Campus</p>
          <p>让学生更容易找到机会，也让项目方更容易找到合适的人。</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <span>Next.js</span>
          <span>TypeScript</span>
          <span>Supabase</span>
          <span>Vercel</span>
        </div>
      </div>
    </footer>
  );
}
