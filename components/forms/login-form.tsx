"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { scrollToFirstError } from "@/lib/form";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { initialActionState, type ActionState } from "@/types/action";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "请输入有效的邮箱地址。";
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先填写正确的邮箱地址。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setServerState({ status: "error", message: error.message });
        return;
      }

      setStep("verify");
      setServerState({
        status: "success",
        message: "验证码已发送到你的邮箱，请输入 6 位验证码完成登录。",
      });
    });
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!code.trim()) {
      nextErrors.code = "请输入邮箱验证码。";
    }
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "请输入有效的邮箱地址。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先补全邮箱和验证码。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error) {
        setServerState({ status: "error", message: "验证码不正确或已过期，请重新获取。" });
        return;
      }

      setServerState({ status: "success", message: "登录成功，正在进入下一步。" });
      router.replace(nextPath);
      router.refresh();
    });
  }

  return step === "request" ? (
    <form onSubmit={handleRequestCode} className="space-y-4">
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
        {isPending ? "发送中..." : "发送邮箱验证码"}
      </button>
    </form>
  ) : (
    <form onSubmit={handleVerifyCode} className="space-y-4">
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

      <label className="block space-y-2">
        <FieldLabel required>邮箱验证码</FieldLabel>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\s+/g, ""))}
          placeholder="输入 6 位验证码"
          className="field-base tracking-[0.24em]"
        />
        <FieldError message={fieldErrors.code} />
      </label>

      <FormFeedback state={serverState} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "验证中..." : "验证并登录"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setCode("");
            setFieldErrors({});
            setServerState(initialActionState);
            setStep("request");
          }}
          className="rounded-full border border-[rgba(17,40,79,0.12)] px-5 py-3 font-semibold text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          重新发送
        </button>
      </div>
    </form>
  );
}
