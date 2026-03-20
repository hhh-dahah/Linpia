"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { scrollToFirstError } from "@/lib/form";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { initialActionState, type ActionState } from "@/types/action";

const MIN_PASSWORD_LENGTH = 6;

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!values.password.trim()) {
      nextErrors.password = "请输入新密码。";
    } else if (values.password.trim().length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = "密码至少需要 6 位。";
    }

    if (!values.confirmPassword.trim()) {
      nextErrors.confirmPassword = "请再输入一次密码。";
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = "两次输入的密码不一致。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先把新密码填写完整。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setServerState({ status: "error", message: mapAuthErrorMessage(error.message) });
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login?reset=success");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <FieldLabel required>新密码</FieldLabel>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
          placeholder="至少 6 位"
          autoComplete="new-password"
          className="field-base"
        />
        <FieldError message={fieldErrors.password} />
      </label>

      <label className="block space-y-2">
        <FieldLabel required>确认新密码</FieldLabel>
        <input
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={(event) =>
            setValues((current) => ({ ...current, confirmPassword: event.target.value }))
          }
          placeholder="再输入一次"
          autoComplete="new-password"
          className="field-base"
        />
        <FieldError message={fieldErrors.confirmPassword} />
      </label>

      <FormFeedback state={serverState} />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "保存新密码"}
      </button>
    </form>
  );
}
