"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { scrollToFirstError } from "@/lib/form";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { initialActionState, type ActionState } from "@/types/action";

type AuthMode = "login" | "register";
type RegisterStep = "form" | "verify";

const MIN_PASSWORD_LENGTH = 6;
const requireEmailConfirmation = process.env.NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION !== "false";

type LoginFormProps = {
  nextPath: string;
  initialState?: ActionState;
};

export function LoginForm({ nextPath, initialState }: LoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [values, setValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    registerCode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverState, setServerState] = useState<ActionState>(initialState ?? initialActionState);
  const [isPending, startTransition] = useTransition();

  function setValue(
    key: "email" | "password" | "confirmPassword" | "registerCode",
    value: string,
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate(currentMode: AuthMode) {
    const nextErrors: Record<string, string> = {};

    if (!values.email.trim() || !values.email.includes("@")) {
      nextErrors.email = "请输入有效的邮箱地址。";
    }

    if (!values.password.trim()) {
      nextErrors.password = "请输入密码。";
    } else if (values.password.trim().length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = "密码至少需要 6 位。";
    }

    if (currentMode === "register") {
      if (!values.confirmPassword.trim()) {
        nextErrors.confirmPassword = "请再输入一次密码。";
      } else if (values.password !== values.confirmPassword) {
        nextErrors.confirmPassword = "两次输入的密码不一致。";
      }
    }

    return nextErrors;
  }

  function resetRegisterFlow() {
    setRegisterStep("form");
    setValues((current) => ({ ...current, registerCode: "" }));
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate("login");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先把邮箱和密码填写完整。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setServerState({ status: "error", message: mapAuthErrorMessage(error.message) });
        return;
      }

      setServerState({ status: "success", message: "登录成功，正在带你回到刚才的操作。" });
      router.replace(`/auth/complete?next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    });
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate("register");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先把注册信息填写完整。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setServerState({ status: "error", message: mapAuthErrorMessage(error.message) });
        return;
      }

      if (data.session) {
        setServerState({ status: "success", message: "注册成功，正在进入下一步。" });
        router.replace(`/auth/complete?next=${encodeURIComponent(nextPath)}`);
        router.refresh();
        return;
      }

      if (requireEmailConfirmation) {
        setRegisterStep("verify");
        setServerState({
          status: "success",
          message: "注册成功，验证码已经发到你的邮箱。输入验证码后就能完成注册。",
        });
        return;
      }

      setServerState({ status: "success", message: "注册成功，现在可以直接登录。" });
    });
  }

  async function handleVerifySignupCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!values.registerCode.trim()) {
      nextErrors.registerCode = "请输入邮箱验证码。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "请先输入邮箱验证码。" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setServerState(initialActionState);

    startTransition(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: values.email.trim(),
        token: values.registerCode.trim(),
        type: "signup",
      });

      if (error) {
        setServerState({ status: "error", message: mapAuthErrorMessage(error.message) });
        return;
      }

      setServerState({ status: "success", message: "邮箱验证成功，正在进入下一步。" });
      router.replace(`/auth/complete?next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-muted)] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setFieldErrors({});
            setServerState(initialState ?? initialActionState);
            resetRegisterFlow();
          }}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)]"
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setFieldErrors({});
            setServerState(initialActionState);
            resetRegisterFlow();
          }}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            mode === "register" ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)]"
          }`}
        >
          注册
        </button>
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block space-y-2">
            <FieldLabel required>邮箱</FieldLabel>
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => setValue("email", event.target.value)}
              placeholder="name@example.com"
              className="field-base"
              autoComplete="email"
            />
            <FieldError message={fieldErrors.email} />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>密码</FieldLabel>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={(event) => setValue("password", event.target.value)}
              placeholder="输入密码"
              className="field-base"
              autoComplete="current-password"
            />
            <FieldError message={fieldErrors.password} />
          </label>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">登录后会自动保持登录状态</span>
            <Link
              href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
              className="font-medium text-[var(--primary)] transition hover:opacity-80"
            >
              忘记密码
            </Link>
          </div>

          <FormFeedback state={serverState} />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "登录中..." : "登录"}
          </button>

          <p className="text-sm text-[var(--muted)]">
            还没有账号？
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFieldErrors({});
                setServerState(initialActionState);
              }}
              className="ml-1 font-medium text-[var(--primary)]"
            >
              去注册
            </button>
          </p>
        </form>
      ) : registerStep === "form" ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <label className="block space-y-2">
            <FieldLabel required>邮箱</FieldLabel>
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => setValue("email", event.target.value)}
              placeholder="name@example.com"
              className="field-base"
              autoComplete="email"
            />
            <FieldError message={fieldErrors.email} />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>密码</FieldLabel>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={(event) => setValue("password", event.target.value)}
              placeholder="至少 6 位"
              className="field-base"
              autoComplete="new-password"
            />
            <FieldError message={fieldErrors.password} />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>确认密码</FieldLabel>
            <input
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => setValue("confirmPassword", event.target.value)}
              placeholder="再输入一次密码"
              className="field-base"
              autoComplete="new-password"
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </label>

          <p className="text-sm leading-7 text-[var(--muted)]">
            注册后请根据系统提示输入邮箱验证码，完成确认后就可以直接用邮箱和密码登录。
          </p>

          <FormFeedback state={serverState} />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "注册中..." : "注册"}
          </button>

          <p className="text-sm text-[var(--muted)]">
            已经有账号？
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFieldErrors({});
                setServerState(initialState ?? initialActionState);
                resetRegisterFlow();
              }}
              className="ml-1 font-medium text-[var(--primary)]"
            >
              去登录
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifySignupCode} className="space-y-4">
          <label className="block space-y-2">
            <FieldLabel required>邮箱</FieldLabel>
            <input
              type="email"
              value={values.email}
              readOnly
              className="field-base bg-[var(--surface-muted)]"
            />
          </label>

          <label className="block space-y-2">
            <FieldLabel required>邮箱验证码</FieldLabel>
            <input
              name="registerCode"
              value={values.registerCode}
              onChange={(event) => setValue("registerCode", event.target.value.trim())}
              placeholder="输入邮箱里的验证码"
              className="field-base"
              autoComplete="one-time-code"
            />
            <FieldError message={fieldErrors.registerCode} />
          </label>

          <p className="text-sm leading-7 text-[var(--muted)]">
            这一步只在注册时需要。验证完成后，后面就直接用邮箱和密码登录。
          </p>

          <FormFeedback state={serverState} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "验证中..." : "验证并完成注册"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setFieldErrors({});
                setServerState(initialActionState);
                resetRegisterFlow();
              }}
              className="rounded-full border border-[rgba(17,40,79,0.12)] px-5 py-3 font-semibold text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              返回修改
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
