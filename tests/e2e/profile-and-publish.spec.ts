import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  deleteUser,
  seedMentorProfile,
  seedStudentProfile,
} from "./helpers/supabase-admin";

async function loginViaUi(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  nextPath = "/",
) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form').getByRole("button", { name: "登录", exact: true }).click();
}

test.describe("身份、资料闭环与发布流程", () => {
  test("学生身份用户可保存资料，再次访问个人资料时不再被拦截身份选择", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: false });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile\/student/);
      await page.locator('input[name="name"]').fill("自动化学生");
      await page.locator('select[name="school"]').selectOption({ index: 1 });
      await page.locator('input[name="major"]').fill("软件工程");
      await page.locator('textarea[name="contact"]').fill("平台内联系");
      await page.locator('form').getByRole("button", { name: /保存学生资料/ }).click();

      await expect(page.getByText("学生资料已保存。")).toBeVisible();

      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile$/);
    } finally {
      await deleteUser(user.id);
    }
  });

  test("导师身份用户可保存资料", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedMentorProfile(user, { completed: false });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile\/mentor/);
      await page.locator('input[name="name"]').fill("自动化导师");
      await page.locator('input[name="organization"]').fill("兰州交通大学 / AI实验室");
      await page.locator('textarea[name="direction"]').fill("AI 内容工具与项目指导");
      await page.locator('input[name="supportScope"]').first().check();
      await page.locator('select[name="supportMethod"]').selectOption({ index: 1 });
      await page.locator('input[name="contactMode"]').fill("平台内联系");
      await page.locator('form').getByRole("button", { name: /保存导师资料/ }).click();

      await expect(page.getByText("导师资料已保存。")).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("学生发招募时漏填必填项会保留已填内容并显示错误", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: true });
      await loginViaUi(page, user.email, user.password, "/publish");

      await expect(page).toHaveURL(/\/publish$/);
      await page.locator('input[name="title"]').fill("自动化测试招募");
      await page.locator('input[name="organization"]').fill("兰州交通大学 / 自动化测试队");
      await page.locator('form').getByRole("button", { name: /发布招募/ }).click();

      await expect(page.getByText("还有必填项没完成，请按提示补充。")).toBeVisible();
      await expect(page.locator('input[name="title"]')).toHaveValue("自动化测试招募");
      await expect(page.locator('input[name="organization"]')).toHaveValue("兰州交通大学 / 自动化测试队");
    } finally {
      await deleteUser(user.id);
    }
  });
});
