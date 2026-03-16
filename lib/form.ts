export function scrollToFirstError(fieldErrors: Record<string, string>) {
  const firstKey = Object.keys(fieldErrors)[0];
  if (!firstKey) {
    return;
  }

  const selectorNames = [firstKey];

  if (firstKey.startsWith("roles.")) {
    const parts = firstKey.split(".");
    const fieldName = parts[2];
    if (fieldName === "roleName") selectorNames.push("roleName");
    if (fieldName === "weeklyHours") selectorNames.push("roleWeeklyHours");
    if (fieldName === "responsibility") selectorNames.push("roleResponsibility");
    if (fieldName === "requirements") selectorNames.push("roleRequirements");
    if (fieldName === "headcount") selectorNames.push("roleHeadcount");
  }

  if (firstKey.startsWith("deliverables.")) {
    selectorNames.push("deliverables");
  }

  const target = selectorNames
    .map((name) => document.querySelector<HTMLElement>(`[name="${name}"]`))
    .find(Boolean);

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in target) {
    target.focus();
  }
}
