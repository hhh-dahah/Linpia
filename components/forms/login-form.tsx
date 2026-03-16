"use client";

import { useState, useTransition } from "react";

import { loginAction } from "@/app/actions";
import { scrollToFirstError } from "@/lib/form";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { initialActionState, type ActionState } from "@/types/action";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "请输入有效邮箱地址";
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先填写正确的邮箱地址" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(initialActionState, formData);
      const serverErrors: Record<string, string> = {};
      const emailError = result.fieldErrors?.email?.[0];
      if (emailError) {
        serverErrors.email = emailError;
        setFieldErrors(serverErrors);
        scrollToFirstError(serverErrors);
      }
      setServerState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-2">
        <FieldLabel required>邮箱地址</FieldLabel>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
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
        {isPending ? "发送中..." : "发送魔法登录链接"}
      </button>
    </form>
  );
}
