import type { DashboardStats } from "../../../../api/dashboardApi";
import { Icon } from "../../core/UI";

export default function StatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary
        icon="users"
        tone="purple"
        label="Tổng thành viên"
        value={stats.memberCount.toLocaleString("vi-VN")}
        detail={`${stats.memberGrowthPercent}% so với tháng trước`}
      />
      <Summary
        icon="online"
        tone="green"
        label="Đang trực tuyến"
        value={stats.onlineCount.toLocaleString("vi-VN")}
        detail={`${stats.onlinePercent}% đang hoạt động`}
      />
      <Summary
        icon="message"
        tone="blue"
        label="Tin nhắn hôm nay"
        value={stats.messagesToday.toLocaleString("vi-VN")}
        detail={`${stats.messageGrowthPercent}% so với hôm qua`}
      />
      <Summary
        icon="voice"
        tone="orange"
        label="Thời gian voice"
        value={`${stats.voiceHoursToday}h`}
        detail={`${stats.voiceGrowthPercent}% trong 7 ngày`}
      />
    </section>
  );
}

function Summary({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  detail: string;
}) {
  let tn =
    tone === "purple"
      ? "bg-[#735de0]/20 text-[#a894ff]"
      : tone === "green"
        ? "bg-[#65e0a1]/15 text-[#65e0a1]"
        : tone === "blue"
          ? "bg-[#5b9cf6]/15 text-[#78b1ff]"
          : "bg-[#f1a45b]/15 text-[#f1a45b]";

  return (
    <article className="flex items-center panel-modifier p-4 gap-3 shadow-[0_10px_26px_var(--shadow-soft)]">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${tn}`}>
        <Icon name={icon} size={21} />
      </div>
      <div>
        <span className="block text-[10px] text-(--muted)">{label}</span>
        <strong className="mt-0.5 block text-[23px] leading-tight text-(--text-main)">
          {value}
        </strong>
        <small className="text-[10px] font-bold text-[#65e0a1]">↑ {detail}</small>
      </div>
    </article>
  );
}
