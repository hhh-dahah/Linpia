import { PublishForm } from "@/components/forms/publish-form";
import { FormShell } from "@/components/ui/form-shell";

export default function PublishPage() {
  return (
    <FormShell
      eyebrow="发布机会"
      title="队长、项目发起人、导师都可以在这里发招募"
      description="先把最关键的信息写清楚就能发布，不想填的可选项可以先留空。我们尽量把表单做得短一点、清楚一点。"
      asideTitle="填写建议"
      asideDescription="飞书式表单的重点不是填很多，而是让别人一眼看懂你的机会在招什么人。"
      tips={["标题直接写清楚项目和招募方向。", "摘要说明当前进度和你缺的角色。", "飞书链接、试合作任务、交付项都可以后补。"]}
    >
      <PublishForm />
    </FormShell>
  );
}
