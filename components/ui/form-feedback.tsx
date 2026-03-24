"use client";

import { cn } from "@/lib/utils";
import type { ActionState } from "@/types/action";

export function FormFeedback({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        state.status === "success"
          ? "bg-[rgba(15,159,119,0.12)] text-success"
          : state.status === "error"
            ? "bg-[rgba(217,45,32,0.1)] text-danger"
            : "bg-[rgba(17,40,79,0.06)] text-muted",
      )}
    >
      {state.message}
    </div>
  );
}
