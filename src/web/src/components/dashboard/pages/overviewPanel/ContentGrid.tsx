import type { DashboardStats } from "../../../../api/dashboardApi";
import type { BotModule } from "../../core/types";
import { Toggle } from "../../core/UI";

interface ModuleListProps {
  modules: BotModule[];
  onToggle: (id: string) => Promise<void> | void;
}

export default function ContentGrid({
  modules,
  stats,
  onToggle,
}: ModuleListProps & { stats: DashboardStats }) {
  const enabled = modules.filter((module) => module.enabled).length;

  return (
    <section className="grid gap-3.5 xl:grid-cols-2">
      <article className="panel-modifier p-4.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[13px] text-(--text-main)">Tăng trưởng thành viên</h3>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">14 ngày</p>
          </div>
          <button className="button-modifier">
            <div className="text-[13px] text-[#a894ff]">14 ngày v</div>
          </button>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <strong className="text-[28px] leading-none text-(--text-main)">
            {stats.memberCount.toLocaleString("vi-VN")}
          </strong>
          <span className="text-[10px] font-bold text-[#65e0a1]">
            ↑ {stats.memberGrowthPercent}%
          </span>
        </div>
        <div className="mt-5 flex h-27 items-end gap-1.5">
          {stats.memberGrowth.map((height, index) => (
            <i
              key={index}
              className={`flex-1 rounded-t bg-[#735de0] ${index % 3 === 2 ? "opacity-50" : "opacity-80"}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-(--muted)">
          <span>05/08</span>
          <span>08/08</span>
          <span>11/08</span>
          <span>14/08</span>
          <span>18/08</span>
        </div>
      </article>
      <article className="panel-modifier p-4.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[13px] text-(--text-main)">Module đang chạy</h3>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">
              {enabled} / {modules.length} module đã kích hoạt
            </p>
          </div>
          <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-[#735de0]/20 px-2 text-[11px] font-bold text-[#a894ff]">
            {enabled}
          </span>
        </div>
        <div className="mt-4">{renderModuleList({ modules, onToggle })}</div>
      </article>
      <article className="panel-modifier p-4.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[13px] text-(--text-main)">Hoạt động gần đây</h3>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">Cập nhật theo thời gian thực</p>
          </div>
          <button>
            <div className="text-[10px] font-bold text-[#a894ff]">Xem tất cả</div>
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {stats.recentActivities.map((activity) => (
            <Activity key={activity.title} {...activity} />
          ))}
        </div>
      </article>
      <article className="panel-modifier p-4.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[13px] text-(--text-main)">Tình trạng bot</h3>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">Thông tin kết nối hiện tại</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#65e0a1]/10 px-2.5 py-1 text-[10px] font-bold text-[#65e0a1]">
            <i className="h-1.5 w-1.5 rounded-full bg-[#65e0a1]" /> Online
          </span>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-19 w-19 shrink-0 place-items-center rounded-full border-[7px] border-[#735de0] text-[17px] font-bold text-(--text-main)">
            <span>
              99.98<small className="text-[10px]">%</small>
            </span>
          </div>
          <div>
            <strong className="text-[12px] text-(--text-main)">Hoạt động ổn định</strong>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">Uptime trong 30 ngày qua</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-(--muted)">Độ trễ gateway</span>
            <b className="text-(--text-soft)">42 ms</b>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-(--muted)">RAM đang dùng</span>
            <b className="text-(--text-soft)">186 MB</b>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-(--muted)">Shards trực tuyến</span>
            <b className="text-(--text-soft)">1 / 1</b>
          </div>
        </div>
      </article>
    </section>
  );
}

function renderModuleList({ modules, onToggle }: ModuleListProps) {
  return modules.slice(0, 4).map((module) => {
    let tn =
      module.tone === "purple"
        ? "bg-[#735de0]/20 text-[#a894ff]"
        : "bg-(--surface-3) text-(--text-soft)";

    return (
      <div
        className="flex items-center gap-2.5 border-b border-(--panel-border) py-2.5 last:border-b-0"
        key={module.id}
      >
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-sm ${tn}`}>
          {module.icon}
        </div>
        <div className="flex-1">
          <strong className="block truncate text-[11px] text-(--text-main)">{module.name}</strong>
          <span className="block text-[9px] text-(--muted)">
            {module.enabled ? "Đang hoạt động" : "Đang tạm dừng"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!module.pending && <span className="w-4 text-xs opacity-0" aria-hidden="true"></span>}
          <Toggle
            checked={module.enabled}
            onClick={() => void onToggle(module.id)}
            label={`Bật tắt ${module.name}`}
            disabled={Boolean(module.pending)}
          />
        </div>
      </div>
    );
  });
}

function Activity({
  icon,
  tone,
  title,
  meta,
}: {
  icon: string;
  tone: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-sm ${tone === "purple" ? "bg-[#735de0]/20 text-[#a894ff]" : tone === "orange" ? "bg-[#f1a45b]/15 text-[#f1a45b]" : "bg-[#5b9cf6]/15 text-[#78b1ff]"}`}
      >
        {icon}
      </div>
      <div className="">
        <strong className="block truncate text-[11px] text-(--text-main)">{title}</strong>
        <span className="block text-[9px] text-(--muted)">{meta}</span>
      </div>
    </div>
  );
}
