# 邻派 Linpai

邻派是一个面向校园场景的轻量协作与招募平台。

它不做复杂社区，也不想把学生和导师丢进一堆信息流里慢慢翻。邻派想解决的是更直接的问题：当你想组队、招人、找导师支持，或者展示自己的技能时，能不能更快找到对的人，并且马上开始合作。

当前平台围绕 3 个核心动作组织：

- 找队伍
- 发招募
- 展示技能

适用场景包括：

- 比赛组队
- 项目招募
- 导师带队 / 指导支持
- 学生展示技能并加入队伍

## 为什么是邻派

很多校园平台的问题不是“功能少”，而是入口太乱、信息太散、身份太割裂。

邻派的设计重点是：

- 用用户动作组织前台，而不是把学生、导师拆成多个复杂入口
- 导师招募、学生队长招募、项目发起招募统一进入一个招募池
- 学生和导师都能通过资料页展示自己，但展示内容按身份区分
- 尽量减少理解成本，让第一次使用的人也能快速上手

如果你是学生，你可以直接看谁在招人、谁在展示技能、自己适合加入什么团队。  
如果你是导师，你可以更清楚地展示研究方向、支持方式和开放机会。  
如果你是队长或项目发起人，你可以更快找到适合加入的人。

## 核心优势

### 1. 前台入口更清楚

平台不是按“学生专区 / 导师专区 / 案例专区”去拆，而是直接围绕最真实的操作设计：

- 我要找队伍
- 我要发招募
- 我要展示技能

这种设计对第一次进入平台的用户更友好，尤其适合校园里传播和拉新。

### 2. 招募池统一，不让人先做身份判断

在很多平台里，用户一进来就被迫先区分“这是导师机会还是学生机会”。  
邻派把这一步延后，用户先看列表，再通过标签判断发布者身份和合作类型。

这样做的好处是：

- 浏览效率更高
- 导师资源不会被埋进单独角落
- 学生队长和项目发起人的招募也能进入同一个流

### 3. 人才池能直接看人

首页除了“找队伍”，还会展示“找人才”模块：

- 导师在上
- 学生在下

用户可以先看导师资料和学生能力卡，再决定要不要联系、报名或发招募。

### 4. 身份闭环完整

平台采用“账号 + 身份”的设计，不默认所有人都是学生。

首次登录后需要选择身份：

- 学生
- 导师

之后分别进入对应资料完善流程，再进入：

- 个人资料展示
- 发布招募
- 报名合作
- 管理自己的发布记录

这让平台在保持前台简洁的同时，后台数据结构也更清晰。

## 适合谁使用

邻派特别适合下面几类用户：

- 想参加比赛但还缺队友的学生
- 已经有项目方向、需要补齐成员的学生队长
- 想发布课题、带队或提供支持的导师
- 想通过能力卡展示自己、提高被看见概率的学生
- 希望做一个更真实、更可执行的校园协作平台的学校团队

## 当前产品结构

主要页面包括：

- 首页
- 找队伍页
- 登录页
- 身份选择页
- 学生资料完善页
- 导师资料完善页
- 学生 / 导师个人主页
- 学生 / 导师发招募页
- 招募详情页
- 报名申请页
- 我的发布管理页

当前核心导航为：

- 首页
- 找队伍
- 发招募
- 人才池
- 个人资料

## 技术方案

当前项目采用：

- Next.js 16
- React 19
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Playwright E2E

整体保持单体架构，适合学校平台在早期快速上线、持续验证、逐步扩展。

最近一轮已补充：

- 公共列表读取优化
- 数据库高频索引
- 公共页短缓存
- 招募与资料更新后的缓存失效
- 基于 RLS 的读写边界收紧

目标不是一次性为超大规模场景过度设计，而是保证在真实增长过程中，平台依然稳定、清晰、可持续迭代。

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

## 数据库初始化

按下面顺序执行：

1. 打开 Supabase 项目里的 `SQL Editor`
2. 先执行 [`supabase/schema.sql`](./supabase/schema.sql)
3. 如果是从旧版库升级，再按顺序执行：
   - [`supabase/migrations/20260317_role_recruitment_upgrade.sql`](./supabase/migrations/20260317_role_recruitment_upgrade.sql)
   - [`supabase/migrations/20260320_auth_password_profiles.sql`](./supabase/migrations/20260320_auth_password_profiles.sql)
   - [`supabase/migrations/20260321_home_talent_pool_constraints.sql`](./supabase/migrations/20260321_home_talent_pool_constraints.sql)
   - [`supabase/migrations/20260322_stability_indexes.sql`](./supabase/migrations/20260322_stability_indexes.sql)
4. 如果需要演示数据，再执行 [`supabase/seed.sql`](./supabase/seed.sql)

## Auth 配置建议

在 Supabase 后台确认：

- `Authentication > Providers > Email` 已开启
- `Password sign-in` 已开启

建议补齐 Redirect URLs：

- `http://localhost:3000`
- `https://linpia.vercel.app`
- `http://localhost:3000/auth/callback`
- `https://linpia.vercel.app/auth/callback`
- `http://localhost:3000/reset-password`
- `https://linpia.vercel.app/reset-password`

如果要接正式邮件能力，建议在 `Authentication > SMTP Settings` 中接入自己的 SMTP 服务。

## 用户流转

当前登录后的闭环是：

1. 先登录
2. 未选择身份则进入身份选择页
3. 未完善资料则进入对应资料页
4. 资料完善后自动回到原操作页

典型流程例如：

- 点击“发布招募”未登录 -> 登录 -> 选身份 -> 补资料 -> 回到发布招募
- 点击“个人资料”未登录 -> 登录 -> 选身份 -> 补资料 -> 回到个人资料
- 点击“立即报名”未登录 -> 登录 -> 回到原招募详情页继续报名

## 项目目标

邻派不是一个“内容社区”，也不是一个信息门户。

它更像一个轻量、直接、真实可用的校园协作工具：

- 让组队更快开始
- 让招募更容易被看见
- 让导师支持更自然地进入校园合作流程
- 让学生能力展示更容易转化成真实合作

如果你也在做校园协作、项目招募或校内创新平台，邻派这套思路会比“功能堆叠”更适合快速落地。
