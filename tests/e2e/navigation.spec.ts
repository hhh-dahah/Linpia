import { expect, test } from "@playwright/test";

test.describe("导航与首页人才池", () => {
  test("顶部导航包含首页、找队伍、发招募、人才池、个人资料", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('nav a[href="/"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/opportunities"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/publish"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/#talent-pool"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/profile"]').first()).toBeVisible();
  });

  test("首页包含找人才模块，导师区在学生区上方", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#talent-pool")).toBeVisible();
    await expect(page.locator("#mentor-section")).toBeVisible();
    await expect(page.locator("#student-section")).toBeVisible();

    const mentorBox = await page.locator("#mentor-section").boundingBox();
    const studentBox = await page.locator("#student-section").boundingBox();

    expect(mentorBox).not.toBeNull();
    expect(studentBox).not.toBeNull();
    expect(mentorBox!.y).toBeLessThan(studentBox!.y);
  });

  test("点击人才池导航会回到首页的人才池模块", async ({ page }) => {
    await page.goto("/opportunities");
    await page.locator('nav a[href="/#talent-pool"]').click();

    await expect(page).toHaveURL(/\/#talent-pool$/);
    await expect(page.locator("#talent-pool")).toBeVisible();
  });
});
