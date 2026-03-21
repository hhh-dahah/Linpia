import { expect, test } from "@playwright/test";

import { createConfirmedUser, deleteUser, seedStudentProfile } from "./helpers/supabase-admin";

async function loginViaUi(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  nextPath = "/",
) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator("form").getByRole("button", { name: "登录", exact: true }).click();
}

test.describe("移动端重点回归", () => {
  test("首页三个动作入口在手机端可见并能跳转", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('a[href="/opportunities"]').first()).toBeVisible();
    await expect(page.locator('a[href="/publish"]').first()).toBeVisible();
    await expect(page.locator('a[href="/profile"]').first()).toBeVisible();

    await page.locator('a[href="/publish"]').first().click();
    await expect(page).toHaveURL(/\/login\?next=%2Fpublish|\/publish/);
  });

  test("手机端导航可以进入首页人才池模块", async ({ page }) => {
    await page.goto("/");
    await page.locator('nav a[href="/#talent-pool"]').first().click();

    await expect(page).toHaveURL(/\/#talent-pool$/);
    await expect(page.locator("#talent-pool")).toBeVisible();
  });

  test("手机端个人资料页不会横向超出屏幕", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: true });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile$/);

      const metrics = await page.evaluate(() => ({
        docWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));

      expect(metrics.docWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    } finally {
      await deleteUser(user.id);
    }
  });
});
