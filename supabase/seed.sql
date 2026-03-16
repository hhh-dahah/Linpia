insert into public.mentors (name, organization, direction, direction_tags, support_scope, contact_mode, is_open)
values
  (
    '王海峰',
    '兰州交通大学 AI+设计工作室',
    'AI 内容工具与校园传播',
    array['AI 工具', '视觉传播', '学生项目'],
    array['方向建议', '项目拆解', '资源背书'],
    '平台申请 + 飞书文档说明',
    true
  ),
  (
    '刘静',
    '机电学院实验室',
    '机器人、嵌入式与控制系统',
    array['机器人', '嵌入式', '控制系统'],
    array['比赛指导', '实验室机会'],
    '平台申请后统一沟通',
    true
  )
on conflict do nothing;

insert into public.cases (title, summary, result_tags)
values
  (
    '轨交巡检项目 7 天内补齐前端展示',
    '通过平台招到 1 名前端和 1 名设计同学，原本只有 Demo 数据接口的项目在一周内完成演示页与答辩封面。',
    array['7 天完成配队', '新增 2 名成员', '答辩素材齐备']
  ),
  (
    '导师工作室引导设计+开发混合组队',
    '导师发布方向后，设计与开发同学围绕 AI 校园内容工具组队，形成持续迭代的项目小组。',
    array['导师连接', '跨专业协作', '形成长期项目']
  )
on conflict do nothing;
