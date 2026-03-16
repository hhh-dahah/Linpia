import type { DashboardApplication } from "@/types/application";
import type { CaseCard } from "@/types/case";
import type { MentorCard } from "@/types/mentor";
import type { OpportunityDetail } from "@/types/opportunity";
import type { TalentDetail } from "@/types/profile";

export const mockOpportunities: OpportunityDetail[] = [
  {
    id: "smart-rail-lab",
    type: "项目招募",
    title: "智慧轨交巡检 Demo 招募跨专业小队",
    summary:
      "项目已有巡检原型，希望补齐前端展示、传感器联调和答辩包装，适合想快速加入真实项目的同学。",
    schoolScope: "兰州交通大学",
    deadline: "2026-04-12",
    skills: ["前端开发", "嵌入式", "UI 设计"],
    status: "开放报名",
    weeklyHours: "每周 8-10 小时",
    applicantCount: 12,
    creatorName: "张同学",
    feishuUrl: "https://www.feishu.cn/product/docs",
    progress: "已完成巡检原型和基础数据采集流程，正在补齐演示页面和路演材料。",
    trialTask: "48 小时内完成一个与你应聘角色相关的小样，例如页面草图、数据看板或接线说明。",
    deliverables: ["可运行的演示页面", "答辩封面图", "试合作记录"],
    roleGaps: [
      {
        id: "role-1",
        roleName: "前端开发",
        responsibility: "完成数据看板和移动端信息页。",
        requirements: "熟悉 React 或 Next.js，有图表页面经验更好。",
        headcount: 1,
        weeklyHours: "8 小时",
      },
      {
        id: "role-2",
        roleName: "UI 设计",
        responsibility: "统一封面、答辩版式与海报视觉。",
        requirements: "能产出 Figma 稿件或同等级视觉稿。",
        headcount: 1,
        weeklyHours: "4 小时",
      },
    ],
  },
  {
    id: "robot-contest",
    type: "比赛组队",
    title: "电子设计赛机器人赛道招募控制与建模同学",
    summary:
      "队内已有硬件底盘和基础控制，正在补算法建模和可视化展示，目标参加省赛与校内路演。",
    schoolScope: "兰州交通大学",
    deadline: "2026-03-28",
    skills: ["算法建模", "硬件调试", "前端开发"],
    status: "开放报名",
    weeklyHours: "每周 10-12 小时",
    applicantCount: 7,
    creatorName: "李队长",
    feishuUrl: "https://www.feishu.cn/product/docs",
    progress: "底盘和传感器模块已跑通，正在完善仿真和展示材料。",
    trialTask: "提交一个控制逻辑思路图或仿真截图。",
    deliverables: ["比赛分工表", "仿真验证说明"],
    roleGaps: [
      {
        id: "role-3",
        roleName: "算法建模",
        responsibility: "负责路径规划和参数调优。",
        requirements: "熟悉 MATLAB、Python 或控制算法基础。",
        headcount: 1,
        weeklyHours: "10 小时",
      },
    ],
  },
  {
    id: "mentor-ai-studio",
    type: "导师机会",
    title: "AI+设计工作室导师开放申请",
    summary:
      "导师愿意指导学生做 AI 内容工具与校园传播相关项目，适合设计、传播、开发混合团队报名。",
    schoolScope: "兰州高校联动",
    deadline: "2026-04-20",
    skills: ["UI 设计", "新媒体运营", "前端开发"],
    status: "开放报名",
    weeklyHours: "每周 6-8 小时",
    applicantCount: 20,
    creatorName: "王老师",
    feishuUrl: "https://www.feishu.cn/product/docs",
    progress: "工作室已有过往成果，本轮希望招募新一批学生持续迭代项目。",
    trialTask: "用 1 页结构图说明你想做的方向和投入方式。",
    deliverables: ["阶段汇报", "作品集链接"],
    roleGaps: [
      {
        id: "role-4",
        roleName: "项目协同",
        responsibility: "协调内容、设计和开发节奏。",
        requirements: "沟通清晰，愿意持续跟进任务和文档。",
        headcount: 2,
        weeklyHours: "6 小时",
      },
    ],
  },
];

export const mockTalents: TalentDetail[] = [
  {
    id: "talent-lin",
    name: "林知夏",
    school: "兰州交通大学",
    major: "软件工程",
    grade: "大三",
    bio: "偏产品与前端，擅长把模糊想法整理成结构化页面和提交流程。",
    skills: ["前端开发", "产品策划", "UI 设计"],
    interestedDirections: ["比赛组队", "项目招募"],
    timeCommitment: "每周 10-15 小时",
    portfolioExternalUrl: "https://www.feishu.cn/product/docs",
    achievements: ["做过 2 个校内工具站点", "参加过创新创业答辩"],
    contactHint: "登录后可投递并留下试合作链接。",
  },
  {
    id: "talent-he",
    name: "何明宇",
    school: "兰州交通大学",
    major: "自动化",
    grade: "大二",
    bio: "偏硬件和传感器联调，喜欢把方案做成可以演示的原型。",
    skills: ["硬件调试", "嵌入式", "算法建模"],
    interestedDirections: ["短期协作", "比赛组队"],
    timeCommitment: "每周 6-10 小时",
    portfolioExternalUrl: "https://github.com/",
    achievements: ["做过智能车课程项目", "能独立完成基础接线和调试"],
    contactHint: "适合传感器、控制和接线验证类任务。",
  },
  {
    id: "talent-song",
    name: "宋一凡",
    school: "西北师范大学",
    major: "数字媒体",
    grade: "大三",
    bio: "偏视觉包装和内容表达，擅长路演海报、视频剪辑和项目包装。",
    skills: ["UI 设计", "视频剪辑", "新媒体运营"],
    interestedDirections: ["项目招募", "导师机会"],
    timeCommitment: "每周 3-5 小时",
    portfolioExternalUrl: "https://www.feishu.cn/product/docs",
    achievements: ["做过学院活动主视觉", "会搭答辩版式和短视频"],
    contactHint: "适合封面、海报、PPT 和展示包装。",
  },
];

export const mockMentors: MentorCard[] = [
  {
    id: "mentor-wang",
    name: "王海峰",
    organization: "兰州交通大学 AI+设计工作室",
    direction: "AI 内容工具与校园传播",
    directionTags: ["AI 工具", "视觉传播", "学生项目"],
    supportScope: ["方向建议", "项目拆解", "资源背书"],
    contactMode: "平台申请 + 飞书文档说明",
    isOpen: true,
  },
  {
    id: "mentor-liu",
    name: "刘静",
    organization: "机电学院实验室",
    direction: "机器人、嵌入式与控制系统",
    directionTags: ["机器人", "嵌入式", "控制系统"],
    supportScope: ["比赛指导", "实验室机会"],
    contactMode: "平台申请后统一沟通",
    isOpen: true,
  },
];

export const mockCases: CaseCard[] = [
  {
    id: "case-1",
    title: "轨交巡检项目 7 天内补齐前端展示",
    summary:
      "通过平台招到 1 名前端和 1 名设计同学，原本只有 Demo 接口的项目在一周内补齐了演示页、答辩封面和展示素材。",
    resultTags: ["7 天完成配齐", "新增 2 名成员", "答辩素材齐备"],
    relatedOpportunityId: "smart-rail-lab",
  },
  {
    id: "case-2",
    title: "导师工作室带动设计 + 开发混合组队",
    summary:
      "导师发布方向后，设计和开发同学围绕 AI 校园内容工具组队，形成了一个可以持续迭代的小项目团队。",
    resultTags: ["导师连接", "跨专业协作", "形成长期项目"],
    relatedOpportunityId: "mentor-ai-studio",
  },
];

export const mockDashboardApplications: DashboardApplication[] = [
  {
    id: "application-1",
    opportunityTitle: "智慧轨交巡检 Demo 招募跨专业小队",
    status: "试合作中",
    submittedAt: "2026-03-11",
  },
  {
    id: "application-2",
    opportunityTitle: "AI+设计工作室导师开放申请",
    status: "待查看",
    submittedAt: "2026-03-13",
  },
];
