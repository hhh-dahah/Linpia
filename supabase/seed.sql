insert into public.mentors (
  name,
  organization,
  school,
  college,
  lab,
  direction,
  direction_tags,
  support_scope,
  support_method,
  application_notes,
  contact_mode,
  is_open
)
values
  (
    '王海峰',
    '兰州交通大学 AI+设计工作室',
    '兰州交通大学',
    null,
    'AI+设计工作室',
    'AI 内容工具与校园传播',
    array['AI', '设计', '学生项目'],
    array['方向建议', '项目拆解', '资源背书'],
    '周期指导 + 项目评审',
    '欢迎设计、开发、传播相关同学申请。',
    '支持方式：周期指导 + 项目评审
联系方式：平台申请后统一沟通
申请说明：欢迎设计、开发、传播相关同学申请。',
    true
  ),
  (
    '刘静',
    '兰州交通大学 机器人实验室',
    '兰州交通大学',
    '机电学院',
    '机器人实验室',
    '机器人、嵌入式与控制系统',
    array['机器人', '硬件', '控制系统'],
    array['比赛指导', '实验室机会'],
    '实验室协作 + 线下指导',
    '适合有比赛意愿和持续投入时间的同学。',
    '支持方式：实验室协作 + 线下指导
联系方式：平台申请后统一沟通
申请说明：适合有比赛意愿和持续投入时间的同学。',
    true
  )
on conflict do nothing;

insert into public.cases (title, summary, result_tags)
values
  (
    '轨交巡检项目 7 天内补齐展示页和答辩材料',
    '通过平台补到前端和设计同学，项目在一周内完成了演示页和路演包装。',
    array['7 天配齐', '新增 2 名成员', '答辩材料完善']
  ),
  (
    '导师带队形成跨专业小队',
    '导师发布方向后，设计和开发同学围绕 AI 校园内容工具快速组队，形成可持续推进的小项目。',
    array['导师连接', '跨专业协作', '形成长期项目']
  )
on conflict do nothing;
