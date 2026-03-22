import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  deleteUser,
  grantAdminUser,
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
  await page.locator("form").getByRole("button", { name: "登录", exact: true }).click();
}

test.describe("后台管理台", () => {
  test("未授权用户访问 /admin 会看到无权限提示", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await loginViaUi(page, user.email, user.password, "/admin");
      await expect(page.getByText("当前账号没有后台权限")).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("超级管理员可以新增展示型学生档案，并同步到首页人才池", async ({ page }) => {
    const adminUser = await createConfirmedUser();
    const uniqueName = `后台新增学生${Date.now().toString().slice(-6)}`;

    try {
      await grantAdminUser(adminUser.id, "super_admin");
      await loginViaUi(page, adminUser.email, adminUser.password, "/admin/people");

      await expect(page.getByRole("heading", { name: "统一维护学生与导师目录" })).toBeVisible();
      await page.locator('input[name="name"]').fill(uniqueName);
      await page.locator('input[name="school"]').fill("兰州交通大学");
      await page.locator('input[name="major"]').fill("软件工程");
      await page.locator('input[name="grade"]').fill("大三");
      await page.locator('input[name="contact"]').fill("平台内联系");
      await page.locator('textarea[name="bio"]').fill("这是后台直接录入的学生档案。");
      await page.getByRole("button", { name: "创建人员" }).click();
      await expect(page.getByText(uniqueName)).toBeVisible();

      await page.goto("/#talent-pool");
      await page.locator("#student-section").scrollIntoViewIfNeeded();
      await expect(page.getByText(uniqueName)).toBeVisible();
    } finally {
      await deleteUser(adminUser.id);
    }
  });
});
