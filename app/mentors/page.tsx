import { MentorCard } from "@/components/cards/mentor-card";
import { PageHeading } from "@/components/ui/page-heading";
import { listMentors } from "@/lib/data";

export default async function MentorsPage() {
  const mentors = await listMentors();

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="导师页" title="先连接愿意轻量支持学生的老师。" description="首版只保留导师方向、支持范围、开放状态和申请说明，避免导师端变成重后台。" />
      <div className="grid gap-5 lg:grid-cols-2">
        {mentors.map((item) => (
          <MentorCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
