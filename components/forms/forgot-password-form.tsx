"use client";

import { useMemo, useState, useTransition } from "react";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { scrollToFirstError } from "@/lib/form";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { initialActionState, type ActionState } from "@/types/action";

export function ForgotPasswordForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "请输入有效的邮箱地址。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先输入正确的邮箱地址。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setServerState({ status: "error", message: mapAuthErrorMessage(error.message) });
        return;
      }

      setServerState({
        status: "success",
        message: "重置邮件已发送，请前往邮箱完成操作。若未收到邮件，请检查垃圾箱或稍后重试。",
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <FieldLabel required>邮箱</FieldLabel>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          className="field-base"
        />
        <FieldError message={fieldErrors.email} />
      </label>

      <FormFeedback state={serverState} />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "发送中..." : "发送重置邮件"}
      </button>
    </form>
  );
}
