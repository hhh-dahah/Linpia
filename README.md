# Match Campus

Match Campus 是一个面向校园协作场景的平台，核心入口只有 3 个：

- 找机会
- 发布机会
- 展示技能

适合学生、队长、项目发起人、导师使用。学生可以找项目、展示自己，队长和导师可以发布招募、快速连接到合适的人。

## 技术栈

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase
- Vercel

## 本地开发

1. 安装依赖

```bash
pnpm install
```

2. 复制环境变量模板

```bash
copy .env.example .env.local
```

3. 填写 `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase Service Role Key
ADMIN_EMAILS=1563664654@qq.com
```

4. 启动开发环境

```bash
pnpm dev
```

5. 常用检查

```bash
pnpm lint
pnpm build
```

## 当前功能

- 首页首屏 3 个核心入口
- 机会列表和详情页
- 人才列表和详情页
- 导师页和案例页
- 邮箱登录入口
- 个人资料填写和管理
- 发布机会
- 报名机会
- 管理员录入导师和案例
- 未配置 Supabase 时自动回退到 Mock 演示模式

## Supabase 数据库初始化

按下面顺序执行：

1. 在 Supabase 项目中打开 SQL Editor
2. 执行 [schema.sql](D:/桌面/网站文件/match-campus/supabase/schema.sql)
3. 如果需要演示数据，再执行 [seed.sql](D:/桌面/网站文件/match-campus/supabase/seed.sql)
4. 在 Storage 中确认 3 个 bucket 已创建：

- `avatars`
- `portfolio-covers`
- `opportunity-covers`

## Vercel 部署

Vercel 需要配置与本地一致的环境变量：

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

建议线上 `NEXT_PUBLIC_APP_URL` 填你的 Vercel 正式域名，例如：

```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

Supabase Auth 里还需要补充回调地址：

- `http://localhost:3000/auth/callback`
- `https://your-project.vercel.app/auth/callback`

## GitHub 推送建议流程

项目当前还没有首个提交，也还没有远程仓库。标准流程如下：

```bash
git add .
git commit -m "feat: initialize match campus"
git remote add origin <你的 GitHub 仓库地址>
git push -u origin master
```

如果你准备改成 `main` 分支，也可以这样：

```bash
git branch -M main
git push -u origin main
```

## 需要的安全凭证

为了帮你完成真实的 GitHub 推送、Supabase 连接和 Vercel 部署，我还需要你以更安全的方式提供下面这些信息，而不是直接提供账号密码：

- GitHub Personal Access Token
- Vercel Token
- Supabase Project URL
- Supabase Anon Key
- Supabase Service Role Key
- GitHub 仓库地址

你可以通过环境变量提供，例如：

```powershell
$env:GITHUB_TOKEN="你的 GitHub PAT"
$env:VERCEL_TOKEN="你的 Vercel Token"
$env:SUPABASE_URL="你的 Supabase URL"
$env:SUPABASE_ANON_KEY="你的 Supabase Anon Key"
$env:SUPABASE_SERVICE_ROLE_KEY="你的 Supabase Service Role Key"
$env:GITHUB_REPO_URL="https://github.com/<user>/<repo>.git"
```

等这些变量准备好后，我就可以继续帮你：

- 创建首个 Git 提交
- 连接 GitHub 远程并推送
- 写入本地 `.env.local`
- 绑定 Supabase
- 通过 Vercel CLI 完成部署
