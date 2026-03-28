# 邻派中期产品稳定版可执行拆解 - 已落地版本

## 1. 本轮目标

这次实现没有去做大而全的重构，而是优先把 3000 用户前最容易反复返工的几个核心边界先定下来：

- 统一状态模型，避免页面继续散落拼接状态文案
- 补齐机会池筛选，固定公开端的主要检索维度
- 给人才与导师详情增加可信度信息块，提升“先看资料再决定联系”的判断效率
- 上线最小轻消息与通知闭环，让报名和状态更新有明确的站内承接
- 维持单体架构，不拆服务、不拆库，只在 `lib/domains/*` 和 `lib/repositories/*` 中建立新分层

## 2. 已完成的架构收口

### 2.1 稳定域模型

新增并固定了以下类型：

- `types/directory.ts`
- `types/conversation.ts`
- `types/notification.ts`
- `lib/domains/status.ts`
- `lib/domains/directory.ts`

这批类型把原来散落在页面和 `lib/data.ts` 里的状态、信任信息和消息能力先收口成了稳定接口。

### 2.2 新分层基础

新增：

- `lib/domains/inbox.ts`
- `lib/repositories/inbox.ts`

作用：

- `domains` 负责会话/通知文案和业务规则
- `repositories` 负责 Supabase 表读写
- 页面和 action 不再直接硬编码所有消息逻辑

## 3. 已完成的产品能力

### 3.1 机会池对标 Handshake 的最小收口

公开机会池已补齐筛选维度：

- 关键词
- 招募类型
- 发布身份
- 学校 / 团队 / 实验室
- 技能标签
- 开放状态

对应页面：

- `app/opportunities/page.tsx`

对应数据层支持：

- `lib/data.ts`

### 3.2 人才池对标 YC + ADPList 的可信展示

学生与导师卡片、详情页已接入“可信度信息块”：

- 资料完整度百分比
- 完整度标签
- 最近更新时间
- 联系状态

对应页面与组件：

- `components/cards/talent-card.tsx`
- `components/cards/mentor-card.tsx`
- `app/talent/[id]/page.tsx`
- `app/mentors/[id]/page.tsx`

### 3.3 轻消息与通知最小闭环

已补齐的闭环：

- 用户报名后，为发布者生成通知
- 每个 `机会 x 报名者` 可以生成单线程会话
- 发布者更新报名状态后，申请者收到通知
- 会话支持站内发送文本消息
- Dashboard 增加最近通知与最近会话入口
- 新增独立的通知与消息中心页面

对应入口：

- `app/dashboard/page.tsx`
- `app/dashboard/inbox/page.tsx`
- `app/dashboard/conversations/[id]/page.tsx`
- `components/inbox/conversation-reply-form.tsx`

对应动作：

- `app/actions.ts`

### 3.4 数据库最小扩展

新增最小表结构：

- `conversation_threads`
- `conversation_messages`
- `notification_events`

并补了基础 RLS 与索引，兼容现有单体和 Supabase 架构。

对应文件：

- `supabase/schema.sql`
- `supabase/migrations/20260326_conversations_notifications.sql`

## 4. 这次没有做的内容

为了保证稳定性，本轮明确没有做这些内容：

- 社区动态流
- 复杂站内 IM
- 群聊
- 已读回执
- 在线状态
- 推荐算法
- 多租户 / 多校隔离
- 微服务拆分

## 5. 当前推荐的后续顺序

### P1

- 继续把 `lib/data.ts` 读取逻辑按机会、人、会话、通知拆到独立 repository
- 继续把 `app/actions.ts` 写入逻辑按资料、招募、报名、会话拆到独立 domain action helper

### P2

- 在“我的报名”和“我的招募”详情里补会话直达入口
- 给通知中心增加按未读筛选
- 给后台列表增加更多来源与更新时间筛选

### P3

- 给公开机会详情增加“相似机会”
- 给人才池增加更稳定的推荐排序策略
- 给站内消息增加更细的状态提示和空状态文案

## 6. 验证结果

已完成：

- TypeScript 检查通过
- ESLint 检查通过
- 新增 Playwright 用例通过

执行过的命令：

- `.\node_modules\.bin\tsc.cmd --noEmit`
- `.\node_modules\.bin\eslint.cmd app lib components tests --max-warnings=0`
- `npx playwright test tests/e2e/inbox.spec.ts --project=chromium`

## 7. 结论

这轮实现已经把“校园轻撮合平台 + 轻消息通知 + 强运营后台”的中期稳定版基础真正落到了代码里。

当前最重要的结果不是多了几个页面，而是主结构已经开始稳定：

- 公开端筛选更清楚
- 资料可信度更明确
- 报名状态有了站内承接
- 后续继续加功能时，不必再把所有逻辑都堆进 `lib/data.ts` 和 `app/actions.ts`

这套基础更适合你后面继续让 AI 按模块持续推进，而不是越改越乱。
