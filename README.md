# 邻派 Linpai

邻派是一个面向校园协作与招募场景的平台，主要入口是：

- 首页
- 找队伍
- 发招募
- 人才池
- 个人资料

当前认证方式已经改成：

- 邮箱 + 密码登录
- 默认保持登录状态
- 邮件只用于注册确认、忘记密码、修改邮箱和安全通知
- 注册确认采用邮箱验证码，不再用确认链接作为主方式

## 本地启动

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
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION=true
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
pnpm exec tsc --noEmit
pnpm build
```

## Supabase 数据库初始化

按下面顺序执行：

1. 打开 Supabase 项目里的 `SQL Editor`
2. 先执行 [`supabase/schema.sql`](D:/桌面/网站文件/match-campus/supabase/schema.sql)
3. 如果是从旧版库升级，按顺序再执行：
   - [`supabase/migrations/20260317_role_recruitment_upgrade.sql`](D:/桌面/网站文件/match-campus/supabase/migrations/20260317_role_recruitment_upgrade.sql)
   - [`supabase/migrations/20260320_auth_password_profiles.sql`](D:/桌面/网站文件/match-campus/supabase/migrations/20260320_auth_password_profiles.sql)
4. 如果需要演示数据，再执行 [`supabase/seed.sql`](D:/桌面/网站文件/match-campus/supabase/seed.sql)

## Supabase Auth 后台配置

### 1. Email Provider

在 `Authentication > Providers > Email` 中确认：

- `Email` 已开启
- `Password sign-in` 已开启

### 2. Confirm Email

当前前端默认按“开启邮箱确认”兼容：

- 正式阶段建议保持开启
- 如果是内测阶段，想减少摩擦，可以关闭

如果你关闭确认，请把环境变量改成：

```env
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION=false
```

### 3. Redirect URLs

在 `Authentication > URL Configuration` 中至少补齐：

- `http://localhost:3000`
- `https://linpia.vercel.app`
- `http://localhost:3000/auth/callback`
- `https://linpia.vercel.app/auth/callback`
- `http://localhost:3000/reset-password`
- `https://linpia.vercel.app/reset-password`

### 4. SMTP

在 `Authentication > SMTP Settings` 中接入阿里云邮件：

- SMTP host
- SMTP port
- SMTP user
- SMTP password
- sender email
- sender name

### 5. Email Templates

建议把模板中的品牌统一成：

- `Linpai`
- `邻派`

并保持文案简洁，重点覆盖：

- 注册确认
- 重置密码
- 修改邮箱

其中注册确认建议改成“邮箱验证码”样式：

- `Confirm sign up` 模板里展示 `{{ .Token }}`
- 不要把注册确认主模板写成 `{{ .ConfirmationURL }}` 按钮

重置密码仍然建议保留链接方式：

- `Reset password` 模板继续使用 `{{ .ConfirmationURL }}`

## 会话与页面流转

当前登录后的流程是：

1. 先登录
2. 没选身份就去身份选择页
3. 资料没完成就去对应资料页
4. 身份和资料都完成后，自动回到原操作页

例如：

- 点“发布招募”未登录 -> 登录 -> 选身份 -> 补资料 -> 回到发布招募
- 点“个人资料”未登录 -> 登录 -> 选身份 -> 补资料 -> 回到个人资料
- 点“立即报名”未登录 -> 登录 -> 回到原详情页继续报名
