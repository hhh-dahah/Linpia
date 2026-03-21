import { expect, test } from "@playwright/test";

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
});
