"use client";

import { GraduationCap, Orbit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveRoleAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState } from "@/types/action";

export function RoleSelectForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<"student" | "mentor" | null>(null);
  const [serverState, setServerState] = useState(initialActionState);

  function handleSelect(role: "student" | "mentor") {
    setSelectedRole(role);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("role", role);

      const result = await saveRoleAction(initialActionState, formData);
      setServerState(result);

      if (result.status === "success") {
        const target = role === "student" ? "/profile/student" : "/profile/mentor";
        router.replace(`${target}?next=${encodeURIComponent(nextPath)}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSelect("student")}
          className={`surface-panel rounded-[1.7rem] p-6 text-left transition ${
            selectedRole === "student"
              ? "border-[rgba(36,107,250,0.26)] shadow-[0_18px_40px_rgba(36,107,250,0.12)]"
              : ""
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(36,107,250,0.12)] text-[var(--primary)]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">我是学生</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            用于展示技能、加入队伍、报名合作，也可以作为学生队长发布招募。
          </p>
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSelect("mentor")}
          className={`surface-panel rounded-[1.7rem] p-6 text-left transition ${
            selectedRole === "mentor"
              ? "border-[rgba(36,107,250,0.26)] shadow-[0_18px_40px_rgba(36,107,250,0.12)]"
              : ""
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,159,74,0.14)] text-[#c26e25]">
            <Orbit className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">我是导师</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            用于展示研究方向、开放指导支持，并通过同一个招募入口发布带队或合作需求。
          </p>
        </button>
      </div>

      <FormFeedback state={serverState} />
    </div>
  );
}
