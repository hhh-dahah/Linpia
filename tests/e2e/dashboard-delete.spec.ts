import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createOpportunity,
  deleteOpportunity,
  deleteUser,
  seedStudentProfile,
} from "./helpers/supabase-admin";

async function loginViaUi(page: import("@playwright/test").Page, email: string, password: string, nextPath: string) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form').getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

async function submitApplication(
  page: import("@playwright/test").Page,
  opportunityId: string,
  contactValue: string,
  introValue?: string,
) {
  await page.goto(`/opportunities/${opportunityId}`);
  await page.locator('input[name="contact"]').fill(contactValue);

  const introField = page.locator('textarea[name="intro"]');
  if ((await introField.count()) > 0) {
    await introField.fill(introValue ?? "我想参与这条招募，并愿意尽快开始协作。");
  }

  await page.getByRole("button", { name: /立即报名/ }).click();
  await expect(page.getByText("报名已提交，发起方看到后会尽快联系你。")).toBeVisible();
}

test.describe("dashboard 删除确认流程", () => {
  test("取消报名需要二次确认，确认后首页人数会同步减少", async ({ browser, page }) => {
    const creator = await createConfirmedUser();
    const applicant = await createConfirmedUser();
    const title = `删除报名测试-${Date.now()}`;
    let opportunityId = "";

    try {
      await seedStudentProfile(creator, { completed: true });
      await seedStudentProfile(applicant, { completed: true });
      opportunityId = await createOpportunity({ creator, creatorRole: "student", title });

      await loginViaUi(page, applicant.email, applicant.password, `/opportunities/${opportunityId}`);
      await submitApplication(page, opportunityId, "微信：delete-application-test");

      await page.goto("/dashboard");
      await expect(page.getByRole("button", { name: "取消这次报名" })).toHaveCount(0);
      await page.getByRole("link", { name: title }).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/applications/`));

      await page.getByRole("button", { name: "取消这次报名" }).click();
      await expect(page.getByText("取消后，这次报名会从你的记录中移除，招募方侧也不会再看到。")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/dashboard/applications/`));

      await page.getByRole("button", { name: "确认取消报名" }).click();
      await expect(page).toHaveURL(/\/dashboard\?message=/);
      await expect(page.getByText("报名已取消。")).toBeVisible();
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);

      const homePage = await browser.newPage();
      await homePage.goto("/");
      const card = homePage
        .locator("div")
        .filter({ has: homePage.getByText(title, { exact: true }) })
        .filter({ has: homePage.getByText("已报名 0 人") })
        .first();
      await expect(card).toBeVisible();
      await homePage.close();
    } finally {
      if (opportunityId) {
        await deleteOpportunity(opportunityId);
      }
      await deleteUser(creator.id);
      await deleteUser(applicant.id);
    }
  });

  test("删除招募需要二次确认，并明确提示会级联删除报名", async ({ browser, page }) => {
    const creator = await createConfirmedUser();
    const applicant = await createConfirmedUser();
    const title = `删除招募测试-${Date.now()}`;
    let opportunityId = "";

    try {
      await seedStudentProfile(creator, { completed: true });
      await seedStudentProfile(applicant, { completed: true });
      opportunityId = await createOpportunity({ creator, creatorRole: "student", title });

      await loginViaUi(page, applicant.email, applicant.password, `/opportunities/${opportunityId}`);
      await submitApplication(page, opportunityId, "微信：delete-opportunity-test");

      const creatorContext = await browser.newContext();
      const creatorPage = await creatorContext.newPage();
      await loginViaUi(creatorPage, creator.email, creator.password, "/dashboard");

      await expect(creatorPage.getByRole("button", { name: "删除招募" })).toHaveCount(0);
      await creatorPage.getByRole("link", { name: title }).click();
      await expect(creatorPage).toHaveURL(new RegExp(`/dashboard/opportunities/${opportunityId}`));

      await creatorPage.getByRole("button", { name: "删除这条招募" }).click();
      await expect(
        creatorPage.getByText("删除后，这条招募和关联的报名记录都会一起删除，且无法恢复。"),
      ).toBeVisible();
      await expect(creatorPage.getByText("微信：delete-opportunity-test")).toBeVisible();

      await creatorPage.getByRole("button", { name: "确认删除招募" }).click();
      await expect(creatorPage).toHaveURL(/\/dashboard\?message=/);
      await expect(creatorPage.getByText("招募已删除。")).toBeVisible();
      await expect(creatorPage.getByRole("link", { name: title })).toHaveCount(0);
      await creatorContext.close();

      const applicantContext = await browser.newContext();
      const applicantPage = await applicantContext.newPage();
      await loginViaUi(applicantPage, applicant.email, applicant.password, "/dashboard");
      await expect(applicantPage.getByRole("link", { name: title })).toHaveCount(0);
      await applicantContext.close();
    } finally {
      if (opportunityId) {
        await deleteOpportunity(opportunityId);
      }
      await deleteUser(creator.id);
      await deleteUser(applicant.id);
    }
  });
});
