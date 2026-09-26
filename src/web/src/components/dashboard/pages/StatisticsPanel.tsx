import { useEffect, useState } from "react";
import { getServerStats, type DashboardStats } from "../../../api/dashboardApi";
import { usePushNotification } from "../../PushNotificationProvider";
import { Stat } from "../core/UI";

export default function StatisticsPanel({
  serverId,
  serverName,
  stats,
  onStatsUpdate,
}: {
  serverId: string;
  serverName: string;
  stats: DashboardStats;
  onStatsUpdate: (stats: DashboardStats) => void;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const { notify } = usePushNotification();
  useEffect(() => {
    const controller = new AbortController();
    const interval = window.setInterval(() => {
      getServerStats(serverId, controller.signal)
        .then(onStatsUpdate)
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            notify(error instanceof Error ? error.message : "Không thể cập nhật thống kê", "error");
          }
        });
    }, 5_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [serverId, onStatsUpdate, notify]);

  const updatedAt = new Date(stats.updatedAt);
  return (
    <section className="grid gap-4">
      <div className="w-max max-w-full rounded-[7px] border border-[#315640] bg-[#1a2b25] px-2.5 py-1.5 text-[10px] text-[#92d9b4]">
        <span className="mr-1.5 inline-block h-1.75 w-1.75 rounded-full bg-[#55d59a] shadow-[0_0_0_3px_#55d59a18]" />{" "}
        Realtime refresh / 5 seconds{" "}
        <time className="ml-2.5 text-[#8eaa9d]">
          Updated{" "}
          {updatedAt.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </time>
      </div>
      <p className="m-0 -mt-1 text-[11px] text-(--muted)">
        Đang xem thống kê của <strong className="text-(--text-main)">{serverName}</strong>
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          icon="message"
          tone="blue"
          title="Messages realtime"
          value={stats.messagesTotal.toLocaleString("vi-VN")}
          detail="live update"
        />
        <Stat
          icon="users"
          tone="purple"
          title="Thành viên mới"
          value={stats.newMembers.toLocaleString("vi-VN")}
          detail={`${stats.memberGrowthPercent}% 30 ngày qua`}
        />
        <Stat
          icon="voice"
          tone="orange"
          title="Voice hours"
          value={`${stats.voiceHoursTotal.toLocaleString("vi-VN")}h`}
          detail={`${stats.voiceGrowthPercent}% 30 ngày qua`}
        />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <article className="rounded-[14px] border border-(--panel-border) bg-(--panel-bg) p-4.5 shadow-[0_10px_26px_var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="m-0 text-[13px] text-(--text-main)">Hoạt động theo ngày</h3>
              <p className="m-0 mt-1 text-[10px] text-(--muted)">Tin nhắn và thành viên tham gia</p>
            </div>
            <div className="flex gap-3 text-[9px] text-(--muted)">
              <span>
                <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#9a7eff]" /> Tin nhắn
              </span>
              <span>
                <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#78b1ff]" /> Thành viên
              </span>
            </div>
          </div>
          <LineChart
            chartData={stats.dailyActivity}
            hoveredPoint={hoveredPoint}
            onHover={setHoveredPoint}
          />
        </article>
        <TopChannels channels={stats.topChannels} />
      </div>
    </section>
  );
}

function LineChart({
  chartData,
  hoveredPoint,
  onHover,
}: {
  chartData: DashboardStats["dailyActivity"];
  hoveredPoint: number | null;
  onHover: (index: number | null) => void;
}) {
  const points = chartData.map((point, index) => ({
    x: 64 + index * (571 / Math.max(1, chartData.length - 1)),
    y: 174 - (point.messages / 2000) * 156,
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x} 174 L${points[0].x} 174 Z`
    : "";

  return (
    <div className="relative mt-4 h-55">
      <svg
        viewBox="0 0 700 210"
        preserveAspectRatio="none"
        className="h-47.5 w-full overflow-visible"
      >
        {[0, 500, 1000, 1500, 2000].map((value, index) => {
          const y = 174 - index * 39;
          return (
            <g key={value}>
              <line x1="54" x2="690" y1={y} y2={y} stroke="#333542" strokeDasharray="3 4" />
              <text x="0" y={y + 3} fill="#77798a" fontSize="9">
                {value === 0 ? "0" : `${value / 1000}k`}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="#775be322" />
        <path
          d={linePath}
          fill="none"
          stroke="#9a7eff"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        {chartData.map((point, index) => {
          const { x, y } = points[index];
          const active = hoveredPoint === index;
          return (
            <circle
              key={`${point.label}-${index}`}
              cx={x}
              cy={y}
              r={active ? 7 : 4.5}
              fill={active ? "#d7ceff" : "#9a7eff"}
              stroke="#1b1c26"
              strokeWidth="3"
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${point.messages} messages`}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(index)}
              onBlur={() => onHover(null)}
              className="cursor-pointer"
            />
          );
        })}
      </svg>
      {hoveredPoint !== null && (
        <div
          className="pointer-events-none absolute z-2 min-w-34.5 -translate-x-1/2 translate-y-[-112%] rounded-[7px] border border-[#4b4d60] bg-[#262735] px-2 py-2 text-[9px] leading-[1.7] text-[#e9e9f3] shadow-[0_8px_22px_#00000055]"
          style={{
            top: `${16 + (1 - chartData[hoveredPoint].messages / 2000) * 148}px`,
            left: `${9 + hoveredPoint * 14.1}%`,
          }}
        >
          <b className="block text-[#c7b9ff]">{chartData[hoveredPoint].label}</b>
          {chartData[hoveredPoint].messages.toLocaleString("vi-VN")} messages
          <br />
          {chartData[hoveredPoint].members} new members
        </div>
      )}
      <div className="-mt-1.5 ml-14.5 mr-3 flex justify-between text-[9px] text-[#77798a]">
        {chartData.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
function TopChannels({ channels }: { channels: DashboardStats["topChannels"] }) {
  return (
    <article className="rounded-[14px] border border-(--panel-border) bg-(--panel-bg) p-4.5 shadow-[0_10px_26px_var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-[13px] text-(--text-main)">Kênh sôi nổi</h3>
          <p className="m-0 mt-1 text-[10px] text-(--muted)">Theo số tin nhắn tuần này</p>
        </div>
      </div>
      {channels.map(({ name, messages, share }) => (
        <div
          className="flex items-center justify-between gap-4 border-b border-(--panel-border) py-3 last:border-b-0"
          key={name}
        >
          <div>
            <strong className="block text-[11px] text-(--text-main)">{name}</strong>
            <span className="block text-[9px] text-(--muted)">
              {messages.toLocaleString("vi-VN")} tin nhắn
            </span>
          </div>
          <div className="h-1.5 w-24 rounded-full bg-(--surface-3)">
            <i className="block h-full rounded-full bg-[#8068ed]" style={{ width: `${share}%` }} />
          </div>
        </div>
      ))}
    </article>
  );
}
