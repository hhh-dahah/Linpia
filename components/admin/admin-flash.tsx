export function AdminFlash({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) {
    return null;
  }

  const tone = error
    ? "border-[rgba(214,59,49,0.18)] bg-[rgba(214,59,49,0.08)] text-danger"
    : "border-[rgba(24,163,111,0.18)] bg-[rgba(24,163,111,0.08)] text-success";

  return (
    <div className={`rounded-[1.3rem] border px-4 py-3 text-sm font-medium ${tone}`}>
      {error || message}
    </div>
  );
}
