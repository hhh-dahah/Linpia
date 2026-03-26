import { expect, test } from "@playwright/test";

test.describe("招募预览与招募池分页", () => {
  test("首页招募区提供查看更多招募入口", async ({ page }) => {
    await page.goto("/");

    const moreLink = page.getByRole("link", { name: "查看更多招募" });
    await expect(moreLink).toBeVisible();
    await expect(moreLink).toHaveAttribute("href", "/opportunities?page=1");
  });

  test("招募池首屏最多展示 5 条，并移除卡片前部次要字段", async ({ page }) => {
    await page.goto("/opportunities?page=1");

    const cards = page.locator("article").filter({
      has: page.locator('a[href*="#apply"]'),
    });

    await expect(cards).toHaveCount(await cards.count());
    expect(await cards.count()).toBeLessThanOrEqual(5);

    await expect(page.locator("body")).not.toContainText("组织：");
    await expect(page.locator("body")).not.toContainText("时间安排：");
    await expect(page.locator("body")).not.toContainText("截止时间：");
    await expect(page.locator("body")).not.toContainText("暂未添加标签");
  });
});
