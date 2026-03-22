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
  customSkills: string[];
  interestedDirections: string[];
  timeCommitment: string;
  portfolioExternalUrl: string;
  experience: string;
  contact: string;
};

const presetSkillSet: Set<string> = new Set(skillOptions);
const maxCustomSkillCount = 5;

function normalizeCustomSkills(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function getInitialValues(profile?: TalentDetail | null): ProfileFormValues {
  return {
    name: profile?.name || "",
    school: profile?.school || "",
    major: profile?.major || "",
    grade: profile?.grade || "",
    bio: profile?.bio || "",
    skillTags: profile?.skills || [],
    customSkills: profile?.customSkills || [],
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
  const [customSkillInput, setCustomSkillInput] = useState("");
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
          customSkills: Array.isArray(parsed.customSkills)
            ? normalizeCustomSkills(parsed.customSkills)
            : current.customSkills,
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

  function addCustomSkill() {
    const nextSkill = customSkillInput.trim();
    if (!nextSkill) {
      return;
    }

    const nextCustomSkills = normalizeCustomSkills([...values.customSkills, nextSkill]).filter(
      (item) => !presetSkillSet.has(item),
    );

    if (nextCustomSkills.length > maxCustomSkillCount) {
      setFieldErrors((current) => ({
        ...current,
        customSkills: "自定义技能最多添加 5 个",
      }));
      return;
    }

    setValue("customSkills", nextCustomSkills);
    setCustomSkillInput("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.customSkills;
      return next;
    });
  }

  function removeCustomSkill(skill: string) {
    setValue(
      "customSkills",
      values.customSkills.filter((item) => item !== skill),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(initialActionState);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      ...values,
      customSkills: normalizeCustomSkills(values.customSkills),
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
      const submitFormData = new FormData(form);
      parsed.data.customSkills.forEach((skill) => submitFormData.append("customSkills", skill));

      const result = await saveProfileAction(initialActionState, submitFormData);
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
        <div className="space-y-3">
          <div>
            <FieldLabel>预设技能标签</FieldLabel>
            <p className="mt-1 text-sm text-[var(--muted)]">先选常用技能，后面也可以补充自定义技能。</p>
          </div>
          <div className="flex flex-wrap gap-2">
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

        <div className="space-y-3">
          <div>
            <FieldLabel>自定义技能</FieldLabel>
            <p className="mt-1 text-sm text-[var(--muted)]">最多添加 5 个，每个 2-10 个字，适合补充更细的技能表达。</p>
          </div>
          <div className="flex gap-3">
            <input
              data-testid="custom-skill-input"
              value={customSkillInput}
              onChange={(event) => setCustomSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomSkill();
                }
              }}
              className="field-base flex-1"
              placeholder="例如：AIGC、短视频剪辑、用户访谈"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              data-testid="add-custom-skill"
              className="ui-button-secondary whitespace-nowrap px-4 py-3 text-sm font-semibold"
            >
              添加技能
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {values.customSkills.length ? (
              values.customSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeCustomSkill(skill)}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(36,107,250,0.22)] bg-[rgba(36,107,250,0.06)] px-3 py-2 text-sm text-[var(--primary-strong)] transition hover:border-[rgba(36,107,250,0.35)]"
                >
                  {skill}
                  <span className="text-xs text-[var(--muted)]">移除</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">还没有添加自定义技能。</p>
            )}
          </div>
          {values.customSkills.map((skill) => (
            <input key={skill} type="hidden" name="customSkills" value={skill} />
          ))}
          <FieldError message={fieldErrors.customSkills} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <FieldLabel>想加入的方向</FieldLabel>
          <p className="mt-1 text-sm text-[var(--muted)]">别人也会根据这些方向判断你更适合哪类合作。</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <FieldLabel required>联系方式</FieldLabel>
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
