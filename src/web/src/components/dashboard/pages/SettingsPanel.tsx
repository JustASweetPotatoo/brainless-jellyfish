import { useState } from "react";
import { Toggle } from "../core/UI";

export default function SettingsPanel() {
  const [saved, setSaved] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [commands, setCommands] = useState(false);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <article className="rounded-[14px] border border-(--panel-border) bg-(--panel-bg) p-5 shadow-[0_10px_26px_var(--shadow-soft)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[13px] text-(--text-main)">Thông tin máy chủ</h3>
            <p className="m-0 mt-1 text-[10px] text-(--muted)">
              Thông tin hiển thị trong dashboard của bạn.
            </p>
          </div>
        </div>
        <label className="grid gap-1.5 text-[10px] font-bold text-(--text-soft)">
          Tên máy chủ
          <input
            className="rounded-lg border border-(--panel-border) bg-(--surface-2) px-3 py-2 text-[11px] text-(--text-main) outline-none focus:border-[#8068ed]"
            defaultValue="Thiên Hà Của Sữa"
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[10px] font-bold text-(--text-soft)">
            Ngôn ngữ
            <select
              className="rounded-lg border border-(--panel-border) bg-(--surface-2) px-3 py-2 text-[11px] text-(--text-main) outline-none focus:border-[#8068ed]"
              defaultValue="vi"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-[10px] font-bold text-(--text-soft)">
            Múi giờ
            <select
              className="rounded-lg border border-(--panel-border) bg-(--surface-2) px-3 py-2 text-[11px] text-(--text-main) outline-none focus:border-[#8068ed]"
              defaultValue="Asia/Ho_Chi_Minh"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        <SettingToggle
          title="Thông báo thành viên mới"
          description="Gửi thông báo tại kênh welcome."
          checked={welcome}
          onClick={() => setWelcome(!welcome)}
        />
        <SettingToggle
          title="Chỉ cho phép slash commands"
          description="Vô hiệu hoá command tiền tố truyền thống."
          checked={commands}
          onClick={() => setCommands(!commands)}
        />
        <button
          className="mt-5 rounded-lg bg-[#8068ed] px-3.5 py-2 text-[10px] font-bold text-white shadow-[0_8px_18px_#4d3fae55]"
          onClick={save}
        >
          {saved ? "✓ Đã lưu thay đổi" : "Lưu thay đổi"}
        </button>
      </article>
      <aside className="rounded-[14px] border border-(--panel-border) bg-(--panel-bg) p-5 shadow-[0_10px_26px_var(--shadow-soft)]">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[linear-gradient(135deg,#5c3ac4,#b864ad)] text-sm font-extrabold text-white">
          TH
        </div>
        <h3 className="mb-1 mt-3 text-[14px] text-(--text-main)">Thiên Hà Của Sữa</h3>
        <span className="text-[10px] text-(--muted)">Máy chủ Discord</span>
        <hr className="my-5 border-(--panel-border)" />
        <h4 className="m-0 text-[11px] text-(--text-soft)">Quyền của bot</h4>
        <p className="mb-0 mt-3 text-[10px] text-(--text-soft)">
          <i className="mr-1 text-[#65e0a1]">✓</i> Manage Roles
        </p>
        <p className="mb-0 mt-2 text-[10px] text-(--text-soft)">
          <i className="mr-1 text-[#65e0a1]">✓</i> Manage Messages
        </p>
        <p className="mb-0 mt-2 text-[10px] text-(--text-soft)">
          <i className="mr-1 text-[#65e0a1]">✓</i> View Audit Log
        </p>
      </aside>
    </section>
  );
}
function SettingToggle({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-(--panel-border) pt-4">
      <div className="min-w-0">
        <strong className="block text-[11px] text-(--text-main)">{title}</strong>
        <span className="mt-1 block text-[10px] text-(--muted)">{description}</span>
      </div>
      <Toggle checked={checked} onClick={onClick} label={title} />
    </div>
  );
}
