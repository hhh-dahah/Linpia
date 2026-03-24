import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createOpportunity,
  deleteOpportunity,
  deleteUser,
  seedStudentProfile,
} from "./helpers/supabase-admin";

async function loginViaUi(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  nextPath: string,
) {
  await expect(page).toHaveURL(new RegExp(`/login\\?next=`));
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form').getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

test.describe("登录拦截与回跳", () => {
  test("已登录的发起方在发招募页可以直接进入管理页", async ({ page }) => {
    const creator = await createConfirmedUser();

    try {
      await seedStudentProfile(creator, { completed: true });
      await page.goto(`/login?next=${encodeURIComponent("/publish")}`);
      await page.locator('input[name="email"]').fill(creator.email);
      await page.locator('input[name="password"]').fill(creator.password);
      await page.locator('form').getByRole("button", { name: "登录", exact: true }).click();

      await expect(page).toHaveURL(/\/publish$/);
      await expect(page.getByRole("link", { name: "进入我的报名和发布管理" })).toBeVisible();
    } finally {
      await deleteUser(creator.id);
    }
  });

  test("未登录访问发招募和个人资料会被拦到登录页", async ({ page }) => {
    await page.goto("/publish");
    await expect(page).toHaveURL(/\/login\?next=%2Fpublish/);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  });

  test("首页展示技能入口会进入同样的资料闭环", async ({ page }) => {
    await page.goto("/");
    await page.locator('main a[href="/profile"]').nth(0).click();

    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  });

  test("未登录报名后，登录成功会回到原招募详情页继续操作", async ({ page }) => {
    const creator = await createConfirmedUser();
    const applicant = await createConfirmedUser();
    let opportunityId = "";

    try {
      await seedStudentProfile(creator, { completed: true });
      await seedStudentProfile(applicant, { completed: true });
      opportunityId = await createOpportunity({ creator, creatorRole: "student" });

      await page.goto(`/opportunities/${opportunityId}`);
      await page.locator(`a[href^="/login?next=%2Fopportunities%2F${opportunityId}"]`).click();

      await loginViaUi(page, applicant.email, applicant.password, `/opportunities/${opportunityId}`);
      await expect(page.locator('textarea[name="note"]')).toBeVisible();

      await page.locator('textarea[name="note"]').fill("我想加入这个自动化测试项目。");
      await page.locator('input[name="contact"]').fill("站内私信或微信联系");
      await page.locator('form').getByRole("button", { name: /立即报名/ }).click();

      await expect(page.getByText("报名已提交，发起方看到后会尽快联系你。")).toBeVisible();
    } finally {
      if (opportunityId) {
        await deleteOpportunity(opportunityId);
      }
      await deleteUser(creator.id);
      await deleteUser(applicant.id);
    }
  });

  test("发起方可以看到报名人数并进入报名详情页", async ({ browser, page }) => {
    const creator = await createConfirmedUser();
    const applicant = await createConfirmedUser();
    let opportunityId = "";

    try {
      await seedStudentProfile(creator, { completed: true });
      await seedStudentProfile(applicant, { completed: true });
      opportunityId = await createOpportunity({ creator, creatorRole: "student" });

      await page.goto(`/opportunities/${opportunityId}`);
      await page.locator(`a[href^="/login?next=%2Fopportunities%2F${opportunityId}"]`).click();
      await loginViaUi(page, applicant.email, applicant.password, `/opportunities/${opportunityId}`);
      await page.locator('textarea[name="note"]').fill("我是来报名的测试用户，想参与这条招募。");
      await page.locator('input[name="contact"]').fill("微信：linpai-test");
      await page.locator('form').getByRole("button", { name: /立即报名/ }).click();
      await expect(page.getByText("报名已提交，发起方看到后会尽快联系你。")).toBeVisible();

      const creatorPage = await browser.newPage();
      await creatorPage.goto(`/login?next=${encodeURIComponent("/dashboard")}`);
      await creatorPage.locator('input[name="email"]').fill(creator.email);
      await creatorPage.locator('input[name="password"]').fill(creator.password);
      await creatorPage.locator('form').getByRole("button", { name: "登录", exact: true }).click();

      await expect(creatorPage.getByText("已报名 1 人")).toBeVisible();
      await creatorPage.getByRole("link", { name: "查看报名详情" }).first().click();
      await expect(creatorPage).toHaveURL(new RegExp(`/dashboard/opportunities/${opportunityId}`));
      await expect(creatorPage.getByText("微信：linpai-test")).toBeVisible();
      await expect(creatorPage.getByText("我是来报名的测试用户，想参与这条招募。")).toBeVisible();
      await creatorPage.close();
    } finally {
      if (opportunityId) {
        await deleteOpportunity(opportunityId);
      }
      await deleteUser(creator.id);
      await deleteUser(applicant.id);
    }
  });
});
