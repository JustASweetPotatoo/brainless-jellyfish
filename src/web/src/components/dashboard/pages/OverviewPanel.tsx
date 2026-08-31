import type { BotModule } from "../core/types";
import { Icon, Toggle } from "../core/UI";

interface Props {
  modules: BotModule[];
  onToggle: (id: string) => void;
}

export default function OverviewPanel({ modules, onToggle }: Props) {
  const enabled = modules.filter((module) => module.enabled).length;
  const bars = [28, 43, 35, 57, 46, 74, 56, 91, 64, 48, 76, 99, 67, 84];
  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> BOT ĐANG HOẠT ĐỘNG
          </div>
          <h2>
            Chào buổi sáng, Administrator <span>✦</span>
          </h2>
          <p>Suwa đang bảo vệ và kết nối cộng đồng của bạn. Mọi thứ vận hành ổn định.</p>
          <div className="hero-actions">
            <button className="primary-button">
              Mời bot <Icon name="arrow" />
            </button>
            <button className="ghost-button">Xem hướng dẫn</button>
          </div>
        </div>
        <div className="bot-orbit" aria-hidden="true">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="bot-face">S</div>
          <span className="floating-star star-one">✦</span>
          <span className="floating-star star-two">✧</span>
        </div>
      </section>
      <section className="stat-grid">
        <Summary
          icon="users"
          tone="purple"
          label="Tổng thành viên"
          value="8,429"
          detail="12.5% so với tháng trước"
        />
        <Summary
          icon="online"
          tone="green"
          label="Đang trực tuyến"
          value="1,284"
          detail="8.2% đang hoạt động"
        />
        <Summary
          icon="message"
          tone="blue"
          label="Tin nhắn hôm nay"
          value="3,691"
          detail="24.8% so với hôm qua"
        />
        <Summary
          icon="voice"
          tone="orange"
          label="Thời gian voice"
          value="124h"
          detail="6.4% trong 7 ngày"
        />
      </section>
      <section className="content-grid">
        <article className="panel member-panel">
          <div className="panel-head">
            <div>
              <h3>Tăng trưởng thành viên</h3>
              <p>14 ngày gần nhất</p>
            </div>
            <button className="select-button">14 ngày⌄</button>
          </div>
          <div className="member-total">
            <strong>8,429</strong>
            <span className="positive">↑ 12.5%</span>
          </div>
          <div className="mini-bars">
            {bars.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="chart-labels">
            <span>05/08</span>
            <span>08/08</span>
            <span>11/08</span>
            <span>14/08</span>
            <span>18/08</span>
          </div>
        </article>
        <article className="panel module-summary">
          <div className="panel-head">
            <div>
              <h3>Module đang chạy</h3>
              <p>
                {enabled} / {modules.length} module đã kích hoạt
              </p>
            </div>
            <span className="count-badge">{enabled}</span>
          </div>
          <div className="module-list">
            {modules.slice(0, 4).map((module) => (
              <div className="module-row" key={module.id}>
                <div className={`module-icon ${module.tone}`}>{module.icon}</div>
                <div className="module-name">
                  <strong>{module.name}</strong>
                  <span>{module.enabled ? "Đang hoạt động" : "Đang tạm dừng"}</span>
                </div>
                <Toggle
                  checked={module.enabled}
                  onClick={() => onToggle(module.id)}
                  label={`Bật tắt ${module.name}`}
                />
              </div>
            ))}
          </div>
        </article>
        <article className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h3>Hoạt động gần đây</h3>
              <p>Cập nhật theo thời gian thực</p>
            </div>
            <button className="text-button">Xem tất cả</button>
          </div>
          <div className="activity-list">
            <Activity
              icon="✦"
              tone="purple"
              title="Moonlight đã tham gia máy chủ"
              meta="2 phút trước · #welcome"
            />
            <Activity
              icon="⌁"
              tone="orange"
              title="AutoMod đã xoá một tin nhắn"
              meta="8 phút trước · #general"
            />
            <Activity
              icon="↗"
              tone="blue"
              title="Dino đạt cấp độ 24"
              meta="15 phút trước · Level & XP"
            />
          </div>
        </article>
        <article className="panel health-panel">
          <div className="panel-head">
            <div>
              <h3>Tình trạng bot</h3>
              <p>Thông tin kết nối hiện tại</p>
            </div>
            <span className="status-pill">
              <i /> Online
            </span>
          </div>
          <div className="health-main">
            <div className="uptime-ring">
              <span>
                99.98<small>%</small>
              </span>
            </div>
            <div>
              <strong>Hoạt động ổn định</strong>
              <p>Uptime trong 30 ngày qua</p>
            </div>
          </div>
          <div className="health-lines">
            <div>
              <span>Độ trễ gateway</span>
              <b>42 ms</b>
            </div>
            <div>
              <span>RAM đang dùng</span>
              <b>186 MB</b>
            </div>
            <div>
              <span>Shards trực tuyến</span>
              <b>1 / 1</b>
            </div>
          </div>
        </article>
      </section>
    </>
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
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} size={21} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className="positive">↑ {detail}</small>
      </div>
    </article>
  );
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
    <div className="activity">
      <div className={`activity-icon ${tone}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
    </div>
  );
}
