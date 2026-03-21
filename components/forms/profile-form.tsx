"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { saveProfileAction } from "@/app/actions";
import { studentDirectionOptions, schools, skillOptions, timeCommitmentOptions } from "@/constants";
import { FormFeedback } from "@/components/ui/form-feedback";
import { FieldError } from "@/components/ui/field-error";
import { FieldLabel } from "@/components/ui/field-label";
import { ImageUploadInput } from "@/components/ui/image-upload-input";
import { scrollToFirstError } from "@/lib/form";
import { initialActionState, type ActionState } from "@/types/action";
import type { TalentDetail } from "@/types/profile";
import { profileSchema } from "@/validators/profile";

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
  experience: string;
  contact: string;
};

function getInitialValues(profile?: TalentDetail | null): ProfileFormValues {
  return {
    name: profile?.name || "",
    school: profile?.school || "",
    major: profile?.major || "",
    grade: profile?.grade || "",
    bio: profile?.bio || "",
    skillTags: profile?.skills || [],
    interestedDirections: profile?.interestedDirections || [],
    timeCommitment: profile?.timeCommitment || "",
    portfolioExternalUrl: profile?.portfolioExternalUrl || "",
    experience: profile?.experience || "",
    contact: profile?.contact || "",
  };
}

export function ProfileForm({
  profile,
  draftStorageKey,
}: {
  profile?: TalentDetail | null;
  draftStorageKey?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<ProfileFormValues>(() => getInitialValues(profile));
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!draftStorageKey) {
      setDraftReady(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileFormValues>;
        setValues((current) => ({
          ...current,
          ...parsed,
          skillTags: Array.isArray(parsed.skillTags) ? parsed.skillTags : current.skillTags,
          interestedDirections: Array.isArray(parsed.interestedDirections)
            ? parsed.interestedDirections
            : current.interestedDirections,
        }));
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey || !draftReady) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(values));
  }, [draftReady, draftStorageKey, values]);

  useEffect(() => {
    if (serverState.status === "success" && draftStorageKey) {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, serverState.status]);

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
      setServerState({ status: "error", message: "学生资料还有几项没填好，请按提示修改。" });
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
          <FieldLabel required>姓名 / 昵称</FieldLabel>
          <input
            name="name"
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            className="field-base"
            placeholder="别人怎么称呼你"
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
            placeholder="例如：软件工程"
          />
        </label>

        <label className="block space-y-2">
          <FieldLabel>年级</FieldLabel>
          <input
            name="grade"
            value={values.grade}
            onChange={(event) => setValue("grade", event.target.value)}
            className="field-base"
            placeholder="例如：大二"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <FieldLabel>自我介绍</FieldLabel>
        <textarea
          name="bio"
          rows={4}
          value={values.bio}
          onChange={(event) => setValue("bio", event.target.value)}
          className="field-base"
          placeholder="简单介绍你擅长什么、想参与什么。"
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
          <FieldLabel>想加入的方向</FieldLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {studentDirectionOptions.map((item) => (
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
          <FieldLabel>比赛 / 项目经历</FieldLabel>
          <textarea
            name="experience"
            rows={4}
            value={values.experience}
            onChange={(event) => setValue("experience", event.target.value)}
            className="field-base"
            placeholder="写你参与过的比赛、项目或合作经历。"
          />
          <FieldError message={fieldErrors.experience} />
        </label>

        <label className="block space-y-2">
          <FieldLabel>联系方式</FieldLabel>
          <textarea
            name="contact"
            rows={4}
            value={values.contact}
            onChange={(event) => setValue("contact", event.target.value)}
            className="field-base"
            placeholder="例如：站内联系 / 飞书 / 微信备注方式"
          />
          <FieldError message={fieldErrors.contact} />
        </label>
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
          <FieldLabel>作品链接</FieldLabel>
          <input
            name="portfolioExternalUrl"
            value={values.portfolioExternalUrl}
            onChange={(event) => setValue("portfolioExternalUrl", event.target.value)}
            placeholder="https://..."
            className="field-base"
          />
          <FieldError message={fieldErrors.portfolioExternalUrl} />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ImageUploadInput
          name="avatar"
          label="头像"
          helper="可选，建议压缩后上传。"
          previewUrl={profile?.avatarPath}
          maxWidthOrHeight={512}
          maxSizeMB={0.12}
        />
        <ImageUploadInput
          name="portfolioCover"
          label="作品封面"
          helper="可选，用于丰富你的资料展示。"
          previewUrl={profile?.portfolioCoverPath}
        />
      </div>

      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "保存中..." : "保存学生资料"}
      </button>
    </form>
  );
}
