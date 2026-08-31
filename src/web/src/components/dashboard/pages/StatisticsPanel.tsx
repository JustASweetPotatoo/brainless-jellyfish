import { useEffect, useState } from "react";
import { Stat } from "../core/UI";

const chartData = [
  { label: "Mon", messages: 820, members: 18 },
  { label: "Tue", messages: 1130, members: 27 },
  { label: "Wed", messages: 940, members: 21 },
  { label: "Thu", messages: 1540, members: 35 },
  { label: "Fri", messages: 1280, members: 31 },
  { label: "Sat", messages: 1870, members: 46 },
  { label: "Sun", messages: 1620, members: 39 },
];

export default function StatisticsPanel() {
  const [stats, setStats] = useState({
    members: 642,
    messages: 78200,
    voiceHours: 1862,
    updatedAt: new Date(),
  });
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  useEffect(() => {
    const id = window.setInterval(
      () =>
        setStats((current) => ({
          members: current.members + Math.floor(Math.random() * 4),
          messages: current.messages + 15 + Math.floor(Math.random() * 60),
          voiceHours: current.voiceHours + Math.floor(Math.random() * 3),
          updatedAt: new Date(),
        })),
      5_000,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <section className="statistics-page">
      <div
        style={{
          width: "max-content",
          maxWidth: "100%",
          margin: "-11px 0 17px",
          padding: "7px 10px",
          color: "#92d9b4",
          border: "1px solid #315640",
          borderRadius: 7,
          background: "#1a2b25",
          fontSize: 10,
        }}
      >
        <span className="live-dot" /> Realtime refresh / 5 seconds{" "}
        <time style={{ marginLeft: 10, color: "#8eaa9d" }}>
          Updated{" "}
          {stats.updatedAt.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </time>
      </div>
      <div className="stat-grid">
        <Stat
          icon="message"
          tone="blue"
          title="Messages realtime"
          value={stats.messages.toLocaleString("vi-VN")}
          detail="live update"
        />
        <Stat
          icon="users"
          tone="purple"
          title="Thành viên mới"
          value={stats.members.toLocaleString("vi-VN")}
          detail="18.2% 30 ngày qua"
        />
        <Stat
          icon="voice"
          tone="orange"
          title="Voice hours"
          value={`${stats.voiceHours.toLocaleString("vi-VN")}h`}
          detail="14.3% 30 ngày qua"
        />
      </div>
      <div className="content-grid stats-detail">
        <article className="panel member-panel">
          <div className="panel-head">
            <div>
              <h3>Hoạt động theo ngày</h3>
              <p>Tin nhắn và thành viên tham gia</p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="purple-dot" /> Tin nhắn
              </span>
              <span>
                <i className="blue-dot" /> Thành viên
              </span>
            </div>
          </div>
          <LineChart hoveredPoint={hoveredPoint} onHover={setHoveredPoint} />
        </article>
        <TopChannels />
      </div>
    </section>
  );
}

function LineChart({
  hoveredPoint,
  onHover,
}: {
  hoveredPoint: number | null;
  onHover: (index: number | null) => void;
}) {
  return (
    <div style={{ position: "relative", height: 220, marginTop: 16 }}>
      <svg
        viewBox="0 0 700 210"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 190, overflow: "visible" }}
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
        <path
          d="M64 111 L160 87 L255 102 L350 54 L445 78 L540 27 L635 48 L635 174 L64 174 Z"
          fill="#775be322"
        />
        <path
          d="M64 111 L160 87 L255 102 L350 54 L445 78 L540 27 L635 48"
          fill="none"
          stroke="#9a7eff"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        {chartData.map((point, index) => {
          const x = 64 + index * 95.2;
          const y = 174 - (point.messages / 2000) * 156;
          const active = hoveredPoint === index;
          return (
            <circle
              key={point.label}
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
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>
      {hoveredPoint !== null && (
        <div
          style={{
            position: "absolute",
            zIndex: 2,
            top: `${16 + (1 - chartData[hoveredPoint].messages / 2000) * 148}px`,
            left: `${9 + hoveredPoint * 14.1}%`,
            minWidth: 138,
            padding: "8px 9px",
            color: "#e9e9f3",
            border: "1px solid #4b4d60",
            borderRadius: 7,
            background: "#262735",
            boxShadow: "0 8px 22px #00000055",
            fontSize: 9,
            lineHeight: 1.7,
            pointerEvents: "none",
            transform: "translate(-50%, -112%)",
          }}
        >
          <b style={{ display: "block", color: "#c7b9ff" }}>{chartData[hoveredPoint].label}</b>
          {chartData[hoveredPoint].messages.toLocaleString("vi-VN")} messages
          <br />
          {chartData[hoveredPoint].members} new members
        </div>
      )}
      <div
        style={{
          margin: "-6px 12px 0 58px",
          display: "flex",
          justifyContent: "space-between",
          color: "#77798a",
          fontSize: 9,
        }}
      >
        {chartData.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
function TopChannels() {
  const channels = [
    ["# general", "12,482", 92],
    ["# media", "8,761", 68],
    ["# gaming", "6,204", 51],
    ["# bot-commands", "4,390", 37],
  ];
  return (
    <article className="panel top-channels">
      <div className="panel-head">
        <div>
          <h3>Kênh sôi nổi</h3>
          <p>Theo số tin nhắn tuần này</p>
        </div>
      </div>
      {channels.map(([name, count, width]) => (
        <div className="channel-row" key={name}>
          <div>
            <strong>{name}</strong>
            <span>{count} tin nhắn</span>
          </div>
          <div className="progress">
            <i style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </article>
  );
}
