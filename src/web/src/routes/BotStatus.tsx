import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

interface BotStatusResponse {
  status: string;
  botTag: string | null;
  pingMs: number;
  uptimeMs: number | null;
  guildCount: number;
  shardIds: number[];
  memoryRssMb: number;
  checkedAt: string;
}

export default function BotStatus() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const response = await fetch("/api/auth/admin/bot-status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const result = (await response.json().catch(() => null)) as
          | BotStatusResponse
          | { message?: string }
          | null;
        if (!response.ok) {
          throw new Error(
            result && "message" in result && result.message
              ? result.message
              : `Bot status API trả về HTTP ${response.status}`,
          );
        }
        if (active) {
          setBotStatus(result as BotStatusResponse);
          setError("");
        }
      } catch (statusError) {
        if (active) {
          setBotStatus(null);
          setError(
            statusError instanceof Error
              ? statusError.message
              : "Không thể kiểm tra trạng thái bot.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin", { replace: true });
  };

  const checkedAt = botStatus
    ? new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(botStatus.checkedAt))
    : "Chưa có dữ liệu";
  const botIsOnline = botStatus?.status === "online";

  return (
    <main className="min-h-screen bg-[#11131a] font-['DM_Sans'] text-[#f1f3f4]">
      <header className="border-b border-[#292e35] bg-[#171a20]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3 text-white no-underline" to="/admin/status">
            <span className="grid h-9 w-9 place-items-center rounded-[11px_11px_11px_4px] bg-[#34765a] font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
              S
            </span>
            <span>
              <strong className="block font-['Plus_Jakarta_Sans'] text-sm font-bold">Suwa</strong>
              <span className="block text-[9px] font-bold text-[#8f9a9a]">ADMIN STATUS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[#a3aaae] sm:inline">{user?.email}</span>
            <button
              className="rounded-md border border-[#41464d] px-3 py-2 text-xs font-semibold text-[#d6d9dc] transition hover:border-[#73b895] hover:text-white"
              onClick={() => void handleLogout()}
              type="button"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#292e35] pb-7">
          <div>
            <p className="m-0 text-[10px] font-bold text-[#81c5a2]">VẬN HÀNH</p>
            <h1 className="m-0 mt-2 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white">
              Trạng thái hệ thống
            </h1>
            <p className="m-0 mt-2 text-sm text-[#9ba2a7]">Theo dõi tình trạng dịch vụ Suwa.</p>
          </div>
          <button
            className="rounded-md bg-[#34765a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#408466] disabled:opacity-60"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setRefreshKey((key) => key + 1);
            }}
            type="button"
          >
            {loading ? "Đang kiểm tra..." : "Làm mới trạng thái"}
          </button>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[#d3d8d8]">Tổng quan dịch vụ</span>
          <span className="text-[#8e979b]">Cập nhật lần cuối: {checkedAt}</span>
        </div>

        <div className="mt-3 divide-y divide-[#292e35] border-y border-[#292e35]">
          <StatusRow
            title="Bot Discord"
            state={
              loading
                ? "Đang kiểm tra"
                : error
                  ? "Không khả dụng"
                  : botIsOnline
                    ? "Đang hoạt động"
                    : "Offline"
            }
            detail={
              error ||
              (botStatus?.botTag
                ? `Đã đăng nhập: ${botStatus.botTag}`
                : "Đang kiểm tra Discord gateway.")
            }
            tone={loading ? "unknown" : error ? "offline" : botIsOnline ? "online" : "offline"}
          />
        </div>

        {botStatus && (
          <dl className="mt-3 grid grid-cols-2 border-b border-[#292e35] sm:grid-cols-3 lg:grid-cols-5">
            <StatusMetric
              label="Gateway ping"
              value={botStatus.pingMs >= 0 ? `${botStatus.pingMs} ms` : "N/A"}
            />
            <StatusMetric label="Uptime" value={formatDuration(botStatus.uptimeMs)} />
            <StatusMetric label="Guilds" value={String(botStatus.guildCount)} />
            <StatusMetric label="Shards" value={botStatus.shardIds.join(", ") || "N/A"} />
            <StatusMetric label="RAM" value={`${botStatus.memoryRssMb} MB`} />
          </dl>
        )}

        <p className="mt-5 text-xs text-[#858e93]">
          Tự động kiểm tra mỗi 30 giây. Cập nhật lần cuối: {checkedAt}
        </p>
      </section>
    </main>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[#292e35] px-4 py-4 first:pl-0 last:border-r-0">
      <dt className="text-[10px] font-semibold text-[#858e93]">{label}</dt>
      <dd className="m-0 mt-2 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds < 0) return "N/A";
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  return days > 0 ? `${days} ngày ${hours} giờ` : `${hours} giờ ${minutes} phút`;
}

function StatusRow({
  title,
  state,
  detail,
  tone,
}: {
  title: string;
  state: string;
  detail: string;
  tone: "online" | "offline" | "unknown";
}) {
  const toneClasses = {
    online: "bg-[#64d69b]",
    offline: "bg-[#ee7373]",
    unknown: "bg-[#d7b86a]",
  };

  return (
    <article className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
      <div>
        <h2 className="m-0 text-sm font-semibold text-white">{title}</h2>
        <p className="m-0 mt-1 text-xs leading-relaxed text-[#929ba0]">{detail}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#dfe3e3] sm:justify-end">
        <span className={`h-2 w-2 rounded-full ${toneClasses[tone]}`} />
        {state}
      </div>
    </article>
  );
}
