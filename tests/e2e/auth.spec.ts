import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  deleteUser,
  generateSignupOtp,
  makeTestEmail,
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

test.describe("认证主流程", () => {
  test("注册后进入验证码确认步骤，并在验证成功后进入身份选择页", async ({ page }) => {
    const email = makeTestEmail("register-flow");
    const password = "Passw0rd!";

    await page.goto("/login");
    await page.getByRole("button", { name: "注册", exact: true }).first().click();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('form').getByRole("button", { name: "注册", exact: true }).click();

    await expect(page.locator('input[name="registerCode"]')).toBeVisible();

    const otp = await generateSignupOtp(email, password);
    await page.locator('input[name="registerCode"]').fill(otp);
    await page.locator('form').getByRole("button", { name: /验证/ }).click();

    await expect(page).toHaveURL(/\/onboarding\/role/);
  });

  test("邮箱密码登录后保持登录状态，并且可以退出登录", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: true });
      await loginViaUi(page, user.email, user.password);

      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('a[href="/profile"]').first()).toBeVisible();

      await page.reload();
      await expect(page.locator('a[href="/profile"]').first()).toBeVisible();

      await page.getByRole("button", { name: "退出登录", exact: true }).click();
      await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("忘记密码可以提交邮箱并显示发送成功提示", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await page.goto("/forgot-password");
      await page.locator('input[name="email"]').fill(user.email);
      await page.getByRole("button", { name: /发送/ }).click();

      await expect(page.getByText("重置邮件已发送，请前往邮箱完成操作")).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });
});
