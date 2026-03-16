"use client";

import { useMemo, useState, useTransition } from "react";

import { saveProfileAction } from "@/app/actions";
import { schools, skillOptions, timeCommitmentOptions } from "@/constants";
import { scrollToFirstError } from "@/lib/form";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { ImageUploadInput } from "@/components/ui/image-upload-input";
import { initialActionState, type ActionState } from "@/types/action";
import type { TalentDetail } from "@/types/profile";
import { profileSchema } from "@/validators/profile";

const directionOptions = ["比赛组队", "项目招募", "导师机会", "短期协作"];

type ProfileFormValues = {
  name: string;
  school: string;
  major: string;
  grade: string;
  bio: string;
  skillTags: string[];
  interestedDirections: string[];
  timeCommitment: string;
  portfolioExternalUrl: string;
};

export function ProfileForm({ profile }: { profile?: TalentDetail | null }) {
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<ProfileFormValues>({
    name: profile?.name || "",
    school: profile?.school || "",
    major: profile?.major || "",
    grade: profile?.grade || "",
    bio: profile?.bio || "",
    skillTags: profile?.skills || [],
    interestedDirections: profile?.interestedDirections || [],
    timeCommitment: profile?.timeCommitment || "",
    portfolioExternalUrl: profile?.portfolioExternalUrl || "",
  });

  const selectedSkills = useMemo(() => new Set(values.skillTags), [values.skillTags]);
  const selectedDirections = useMemo(
    () => new Set(values.interestedDirections),
    [values.interestedDirections],
  );

  function setValue<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleFromList(key: "skillTags" | "interestedDirections", item: string) {
    setValues((current) => {
      const exists = current[key].includes(item);
      return {
        ...current,
        [key]: exists ? current[key].filter((value) => value !== item) : [...current[key], item],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);

    const formData = new FormData(event.currentTarget);
    const payload = {
      ...values,
      avatar: formData.get("avatar"),
      portfolioCover: formData.get("portfolioCover"),
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      setServerState({ status: "error", message: "还有信息没填完整，请按提示修改" });
      scrollToFirstError(nextErrors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await saveProfileAction(initialActionState, formData);
      const nextErrors: Record<string, string> = {};
      Object.entries(result.fieldErrors || {}).forEach(([key, messages]) => {
        const first = messages?.[0];
        if (first) {
          nextErrors[key] = first;
        }
      });
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        scrollToFirstError(nextErrors);
      }
      setServerState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel required>姓名</FieldLabel>
          <input
            name="name"
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            className="field-base"
          />
          <FieldError message={fieldErrors.name} />
        </label>

        <label className="block space-y-2">
          <FieldLabel>学校</FieldLabel>
          <select
            name="school"
            value={values.school}
            onChange={(event) => setValue("school", event.target.value)}
            className="field-base"
          >
            <option value="">暂不填写</option>
            {schools.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <FieldLabel>专业</FieldLabel>
          <input
            name="major"
            value={values.major}
            onChange={(event) => setValue("major", event.target.value)}
            className="field-base"
          />
        </label>

        <label className="block space-y-2">
          <FieldLabel>年级</FieldLabel>
          <input
            name="grade"
            value={values.grade}
            onChange={(event) => setValue("grade", event.target.value)}
            className="field-base"
            placeholder="如：大二"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel>一句话介绍</FieldLabel>
        <textarea
          name="bio"
          rows={4}
          value={values.bio}
          onChange={(event) => setValue("bio", event.target.value)}
          className="field-base"
          placeholder="简单介绍你现在在做什么、想参与什么"
        />
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FieldLabel>技能标签</FieldLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {skillOptions.map((item) => (
              <label
                key={item}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  selectedSkills.has(item)
                    ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                    : "border-[rgba(17,40,79,0.12)] bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="skillTags"
                  value={item}
                  checked={selectedSkills.has(item)}
                  onChange={() => toggleFromList("skillTags", item)}
                />
                {item}
              </label>
            ))}
          </div>
          <FieldError message={fieldErrors.skillTags} />
        </div>

        <div>
          <FieldLabel>想参与方向</FieldLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {directionOptions.map((item) => (
              <label
                key={item}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  selectedDirections.has(item)
                    ? "border-[rgba(36,107,250,0.3)] bg-[rgba(36,107,250,0.08)] text-[var(--primary-strong)]"
                    : "border-[rgba(17,40,79,0.12)] bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="interestedDirections"
                  value={item}
                  checked={selectedDirections.has(item)}
                  onChange={() => toggleFromList("interestedDirections", item)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <FieldLabel>可投入时间</FieldLabel>
          <select
            name="timeCommitment"
            value={values.timeCommitment}
            onChange={(event) => setValue("timeCommitment", event.target.value)}
            className="field-base"
          >
            <option value="">暂不填写</option>
            {timeCommitmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <FieldLabel>作品外链</FieldLabel>
          <input
            name="portfolioExternalUrl"
            value={values.portfolioExternalUrl}
            onChange={(event) => setValue("portfolioExternalUrl", event.target.value)}
            placeholder="https://...（飞书、GitHub、作品页都可以）"
            className="field-base"
          />
          <FieldError message={fieldErrors.portfolioExternalUrl} />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ImageUploadInput
          name="avatar"
          label="头像（可选）"
          helper="建议压缩到 256x256 左右，100KB 内"
          previewUrl={profile?.avatarPath}
          maxWidthOrHeight={512}
          maxSizeMB={0.12}
        />
        <ImageUploadInput
          name="portfolioCover"
          label="作品封面（可选）"
          helper="长边建议 1280px，200-300KB 内"
          previewUrl={profile?.portfolioCoverPath}
        />
      </div>

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "保存人才卡"}
      </button>
    </form>
  );
}
