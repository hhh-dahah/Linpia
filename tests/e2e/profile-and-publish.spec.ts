import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createOpportunity,
  deleteOpportunity,
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
  await page.locator("form").getByRole("button", { name: "登录", exact: true }).click();
}

test.describe("身份、资料闭环与发布流程", () => {
  test("学生保存资料后，个人资料页正常展示且首页人才池可见", async ({ page }) => {
    const user = await createConfirmedUser();
    const uniqueName = `测试学生${Date.now().toString().slice(-6)}`;

    try {
      await seedStudentProfile(user, { completed: false });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile\/student/);
      await page.locator('input[name="name"]').fill(uniqueName);
      await page.locator('select[name="school"]').selectOption({ index: 1 });
      await page.locator('input[name="major"]').fill("软件工程");
      await page.locator('textarea[name="bio"]').fill("我想展示自己的前端和产品能力。");
      await page.locator('textarea[name="contact"]').fill("平台内联系");
      await page.getByRole("button", { name: "保存学生资料" }).click();

      await expect(page.getByText("学生资料已保存。")).toBeVisible();

      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible();
      await expect(page.getByText("你的资料还没有准备好")).toHaveCount(0);

      await page.goto("/#talent-pool");
      await page.locator("#talent-pool").scrollIntoViewIfNeeded();
      await expect(page.locator("#student-section").getByRole("heading", { name: uniqueName })).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("导师保存资料后，个人资料页正常展示且首页人才池可见", async ({ page }) => {
    const user = await createConfirmedUser();
    const uniqueName = `测试导师${Date.now().toString().slice(-6)}`;

    try {
      await seedMentorProfile(user, { completed: false });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile\/mentor/);
      await page.locator('input[name="name"]').fill(uniqueName);
      await page.locator('input[name="organization"]').fill("兰州交通大学 / AI 实验室");
      await page.locator('textarea[name="direction"]').fill("AI 内容工具与项目指导");
      await page.locator('input[name="supportScope"]').first().check();
      await page.locator('select[name="supportMethod"]').selectOption({ index: 1 });
      await page.locator('input[name="contactMode"]').fill("平台申请后统一沟通");
      await page.getByRole("button", { name: "保存导师资料" }).click();

      await expect(page.getByText("导师资料已保存。")).toBeVisible();

      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible();
      await expect(page.getByText("你的资料还没有准备好")).toHaveCount(0);

      await page.goto("/#talent-pool");
      await page.locator("#mentor-section").scrollIntoViewIfNeeded();
      await expect(page.locator("#mentor-section").getByText(uniqueName)).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("学生资料表单离开页面后会恢复未提交草稿", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: false });
      await loginViaUi(page, user.email, user.password, "/profile");

      await expect(page).toHaveURL(/\/profile\/student/);
      await page.locator('input[name="name"]').fill("草稿恢复测试");
      await page.locator('input[name="major"]').fill("人工智能");
      await page.locator('textarea[name="bio"]').fill("这是一个未提交但应该恢复的草稿。");

      await page.goto("/opportunities");
      await page.goto("/profile/student");

      await expect(page.locator('input[name="name"]')).toHaveValue("草稿恢复测试");
      await expect(page.locator('input[name="major"]')).toHaveValue("人工智能");
      await expect(page.locator('textarea[name="bio"]')).toHaveValue("这是一个未提交但应该恢复的草稿。");
    } finally {
      await deleteUser(user.id);
    }
  });

  test("首页人才池不再显示示例数据", async ({ page }) => {
    await page.goto("/#talent-pool");
    await page.locator("#talent-pool").scrollIntoViewIfNeeded();

    await expect(page.getByText("示例")).toHaveCount(0);
    await expect(page.getByText("王海峰")).toHaveCount(0);
    await expect(page.getByText("刘静")).toHaveCount(0);
    await expect(page.getByText("宋一凡")).toHaveCount(0);
  });

  test("学生发招募时漏填必填项会保留已填内容并显示错误", async ({ page }) => {
    const user = await createConfirmedUser();

    try {
      await seedStudentProfile(user, { completed: true });
      await loginViaUi(page, user.email, user.password, "/publish");

      await expect(page).toHaveURL(/\/publish$/);
      await page.locator('input[name="title"]').fill("自动化测试招募");
      await page.locator('input[name="organization"]').fill("兰州交通大学 / 自动化测试队");
      await page.getByRole("button", { name: /发布招募/ }).click();

      await expect(page.getByText("还有必填项没完成，请按提示补充。")).toBeVisible();
      await expect(page.locator('input[name="title"]')).toHaveValue("自动化测试招募");
      await expect(page.locator('input[name="organization"]')).toHaveValue("兰州交通大学 / 自动化测试队");
    } finally {
      await deleteUser(user.id);
    }
  });

  test("发布管理页只显示当前用户自己的招募", async ({ page }) => {
    const owner = await createConfirmedUser();
    const anotherUser = await createConfirmedUser();
    let ownerOpportunityId = "";
    let anotherOpportunityId = "";

    try {
      await seedStudentProfile(owner, { completed: true });
      await seedStudentProfile(anotherUser, { completed: true });
      ownerOpportunityId = await createOpportunity({
        creator: owner,
        creatorRole: "student",
        title: "我的发布管理测试招募",
      });
      anotherOpportunityId = await createOpportunity({
        creator: anotherUser,
        creatorRole: "student",
        title: "不该出现在我后台的招募",
      });

      await loginViaUi(page, owner.email, owner.password, "/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText("我的发布管理测试招募")).toBeVisible();
      await expect(page.getByText("不该出现在我后台的招募")).toHaveCount(0);
    } finally {
      if (ownerOpportunityId) {
        await deleteOpportunity(ownerOpportunityId);
      }
      if (anotherOpportunityId) {
        await deleteOpportunity(anotherOpportunityId);
      }
      await deleteUser(owner.id);
      await deleteUser(anotherUser.id);
    }
  });
});
