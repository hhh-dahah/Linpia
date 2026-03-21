import { expect, test } from "@playwright/test";

import { createConfirmedUser, deleteUser, deleteUserByEmail, makeTestEmail } from "./helpers/supabase-admin";

test.describe("认证主流程", () => {
  test.describe.configure({ mode: "serial" });

  test("注册成功后直接回到登录表单，不再出现验证码步骤", async ({ page }) => {
    const email = makeTestEmail("register-flow");
    const password = "Passw0rd!";

    try {
      await page.goto("/login");
      await page.getByRole("button", { name: "注册", exact: true }).first().click();
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.locator('input[name="confirmPassword"]').fill(password);
      await page.locator('form').getByRole("button", { name: "注册", exact: true }).click();

      await expect(page.locator('input[name="registerCode"]')).toHaveCount(0);
      await expect(
        page.getByText("注册成功，已为你创建账号，请继续登录。"),
      ).toBeVisible();
      await expect(page.locator('input[name="password"]')).toHaveValue("");
      await expect(page.locator('form').getByRole("button", { name: "登录", exact: true })).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
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
