"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState, type ActionResult } from "@/types/action";

type InlineDangerConfirmActionProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  hiddenFields: Record<string, string>;
  triggerLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel?: string;
};

export function InlineDangerConfirmAction({
  action,
  hiddenFields,
  triggerLabel,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel = "先不删",
}: InlineDangerConfirmActionProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionResult>(initialActionState);

  const entries = useMemo(() => Object.entries(hiddenFields), [hiddenFields]);

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();

      entries.forEach(([key, value]) => {
        formData.set(key, value);
      });

      const result = await action(formData);
      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => {
            setState(initialActionState);
            setIsConfirming(true);
          }}
          className="rounded-full border border-[rgba(255,125,80,0.35)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(255,125,80,0.08)]"
        >
          {triggerLabel}
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[rgba(255,125,80,0.2)] bg-[rgba(255,125,80,0.06)] p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">{confirmTitle}</p>
            <p className="text-sm leading-6 text-[var(--muted)]">{confirmDescription}</p>
          </div>

          {state.message ? <FormFeedback state={state} /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "处理中..." : confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isPending) {
                  return;
                }
                setState(initialActionState);
                setIsConfirming(false);
              }}
              className="ui-button-secondary px-4 py-2 text-sm font-semibold"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
