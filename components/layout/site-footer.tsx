export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-[var(--line)] bg-[rgba(255,255,255,0.72)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-[var(--foreground)]">邻派 Linpai</p>
          <p>让学生、队长和导师在一个平台里更快开始合作。</p>
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
