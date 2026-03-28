import { expect, test } from "@playwright/test";

test.describe("通知与消息入口", () => {
  test("未登录访问通知中心会跳转到登录页", async ({ page }) => {
    await page.goto("/dashboard/inbox");

    await expect(page).toHaveURL(/\/login\?next=(%2Fdashboard%2Finbox|\/dashboard\/inbox)/);
  });

  test("机会池包含发布身份和开放状态筛选", async ({ page }) => {
    await page.goto("/opportunities");

    await expect(page.locator('select[name="creatorRole"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });
});
