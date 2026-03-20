export const accountRoles = ["student", "mentor"] as const;

export type AccountRole = (typeof accountRoles)[number];

export type UserFlowStatus = "needs_login" | "needs_role" | "needs_profile" | "ready";

export type DisplayIdentity = {
  label: string;
  nickname: string | null;
  role: AccountRole | null;
};
