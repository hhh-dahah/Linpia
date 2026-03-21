export default function ProfileLoading() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:gap-6">
      <div className="surface-panel overflow-hidden rounded-[1.6rem] px-5 py-6 sm:rounded-[1.9rem] sm:px-8 sm:py-8">
        <div className="h-9 w-28 animate-pulse rounded-full bg-[rgba(36,107,250,0.08)]" />
        <div className="mt-5 h-24 max-w-[28rem] animate-pulse rounded-[1.5rem] bg-[rgba(17,40,79,0.08)]" />
        <div className="mt-4 h-20 animate-pulse rounded-[1.2rem] bg-[rgba(17,40,79,0.06)]" />
        <div className="mt-8 h-64 animate-pulse rounded-[1.5rem] bg-[rgba(17,40,79,0.05)]" />
      </div>

      <div className="surface-card overflow-hidden rounded-[1.6rem] px-4 py-5 sm:rounded-[1.9rem] sm:px-8 sm:py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-[1.3rem] bg-[rgba(17,40,79,0.06)]" />
          <div className="h-28 animate-pulse rounded-[1.3rem] bg-[rgba(17,40,79,0.06)]" />
          <div className="h-28 animate-pulse rounded-[1.3rem] bg-[rgba(17,40,79,0.06)]" />
          <div className="h-28 animate-pulse rounded-[1.3rem] bg-[rgba(17,40,79,0.06)]" />
        </div>
      </div>
    </div>
  );
}
