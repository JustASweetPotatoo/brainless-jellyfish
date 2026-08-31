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
    <section className="settings-layout">
      <article className="panel settings-card">
        <div className="panel-head">
          <div>
            <h3>Thông tin máy chủ</h3>
            <p>Thông tin hiển thị trong dashboard của bạn.</p>
          </div>
        </div>
        <label>
          Tên máy chủ
          <input defaultValue="Thiên Hà Của Sữa" />
        </label>
        <div className="form-row">
          <label>
            Ngôn ngữ
            <select defaultValue="vi">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Múi giờ
            <select defaultValue="Asia/Ho_Chi_Minh">
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
        <button className="primary-button save-button" onClick={save}>
          {saved ? "✓ Đã lưu thay đổi" : "Lưu thay đổi"}
        </button>
      </article>
      <aside className="panel permissions-card">
        <div className="server-avatar">TH</div>
        <h3>Thiên Hà Của Sữa</h3>
        <span>Máy chủ Discord</span>
        <hr />
        <h4>Quyền của bot</h4>
        <p>
          <i>✓</i> Manage Roles
        </p>
        <p>
          <i>✓</i> Manage Messages
        </p>
        <p>
          <i>✓</i> View Audit Log
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
    <div className="setting-switch">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Toggle checked={checked} onClick={onClick} label={title} />
    </div>
  );
}
