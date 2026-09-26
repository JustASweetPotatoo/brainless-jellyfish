import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const features = [
  ["✦", "Moderation thông minh", "Giữ cộng đồng an toàn với bộ lọc, cảnh báo và log rõ ràng."],
  ["↗", "Level & XP", "Biến mỗi cuộc trò chuyện thành động lực để thành viên gắn bó."],
  ["◈", "Game cộng đồng", "Nối từ, bảng xếp hạng và những khoảnh khắc vui vẻ mỗi ngày."],
];

const stats = [
  ["1.2M+", "Tin nhắn được quản lý"],
  ["8,500+", "Thành viên đang kết nối"],
  ["99.98%", "Bot uptime"],
  ["24/7", "Đồng hành cùng server"],
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const dashboardPath = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-[#11121a] font-['DM_Sans'] text-[#eeeeF6]">
      <header className="mx-auto flex h-[78px] max-w-[1180px] items-center justify-between px-6">
        <Link className="flex items-center gap-2.5 text-white no-underline" to="/">
          <span className="grid h-[37px] w-[37px] place-items-center rounded-[12px_12px_12px_4px] bg-[linear-gradient(135deg,#957bff,#6247d8)] font-['Plus_Jakarta_Sans'] text-[21px] font-extrabold shadow-[0_9px_23px_#775fff4d]">
            S
          </span>
          <span>
            <strong className="block font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
              Suwa
            </strong>
            <small className="mt-0.5 block text-[8px] font-bold tracking-[1.2px] text-[#828397]">
              BOT DASHBOARD
            </small>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs text-[#aaaaba]">
          <a className="hover:text-white" href="#features">
            Tính năng
          </a>
          <a className="hover:text-white" href="#community">
            Cộng đồng
          </a>
          <Link
            className="rounded-lg border border-[#4c4c5c] px-3.5 py-2 text-white no-underline"
            to={dashboardPath}
          >
            {isAuthenticated ? "Mở dashboard" : "Đăng nhập"}
          </Link>
        </nav>
      </header>
      <section className="relative mx-auto max-w-[1110px] px-6 pb-0 pt-[103px] text-center">
        <div className="pointer-events-none absolute left-1/2 top-[30px] h-[430px] w-[650px] -translate-x-1/2 bg-[radial-gradient(ellipse,#7657e747_0%,#31266020_42%,transparent_70%)]" />
        <div className="relative inline-flex items-center gap-2 rounded-full border border-[#5e4b9a] bg-[#34296199] px-2.5 py-1.5 text-[10px] font-bold text-[#c0b1ff]">
          <i className="h-1.5 w-1.5 rounded-full bg-[#65e0a1]" /> Được tin dùng bởi cộng đồng
          Discord Việt Nam
        </div>
        <h1 className="relative mx-auto mt-5 max-w-[770px] font-['Plus_Jakarta_Sans'] text-[clamp(42px,6vw,72px)] font-extrabold leading-[1.05] tracking-[-3.5px]">
          Biến server Discord thành một{" "}
          <span className="bg-[linear-gradient(100deg,#ae98ff,#d79eff)] bg-clip-text text-transparent">
            cộng đồng đáng nhớ.
          </span>
        </h1>
        <p className="relative mx-auto mt-5 max-w-[525px] text-sm leading-relaxed text-[#aaaaba]">
          Suwa giúp bạn quản lý, tạo kết nối và hiểu cộng đồng của mình — tất cả trong một bot thân
          thiện, mạnh mẽ.
        </p>
        <div className="relative mt-7 flex justify-center gap-3">
          <Link
            className="rounded-lg bg-[#8068ed] px-5 py-3 text-xs font-bold text-white no-underline shadow-[0_9px_24px_#6048d455]"
            to={dashboardPath}
          >
            Bắt đầu miễn phí <span>→</span>
          </Link>
          <a
            className="rounded-lg border border-[#4c4c5c] px-5 py-3 text-xs font-bold text-[#d0cbe1] no-underline"
            href="#features"
          >
            Khám phá tính năng
          </a>
        </div>
        <div className="relative mt-5 text-[10px] text-[#77798a]">
          Không cần thẻ tín dụng <span className="px-2">•</span> Thiết lập trong 2 phút
        </div>
        <div className="mx-auto mt-10 flex max-w-[850px] overflow-hidden rounded-xl border border-[#353247] bg-[#1b1a27] text-left shadow-[0_20px_60px_#00000055]">
          <aside className="hidden w-[170px] shrink-0 border-r border-[#302e3e] bg-[#171621] p-4 sm:block">
            <div className="mb-8 font-['Plus_Jakarta_Sans'] text-sm font-bold">
              <b className="mr-1.5 text-[#9b82ff]">S</b> Suwa
            </div>
            <p className="text-[8px] tracking-[1px] text-[#77798a]">MENU</p>
            <div className="mt-3 rounded-md bg-[#735de0] px-2.5 py-2 text-[10px] text-white">
              ▦ Tổng quan
            </div>
            <div className="px-2.5 py-2 text-[10px] text-[#858798]">◫ Modules</div>
            <div className="px-2.5 py-2 text-[10px] text-[#858798]">⌁ Statistics</div>
          </aside>
          <div className="min-w-0 flex-1 p-5">
            <h3 className="m-0 text-sm text-white">Chào mừng trở lại, Admin ✦</h3>
            <p className="mt-1 text-[10px] text-[#858798]">
              Đây là những gì đang diễn ra trong server của bạn.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["MEMBERS", "8,429"],
                ["ONLINE", "1,284"],
                ["MESSAGES", "3,691"],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-[#302e3e] bg-[#22202f] p-2.5" key={label}>
                  <span className="block text-[8px] text-[#77798a]">{label}</span>
                  <strong className="mt-1 block text-lg text-white">{value}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-16 items-end gap-2 rounded-lg bg-[#221f32] px-4">
              {[35, 55, 42, 70, 52, 82].map((height, index) => (
                <i
                  className="flex-1 rounded-t bg-[#8068ed]"
                  style={{ height: `${height}%` }}
                  key={`${height}-${index}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-20 border-y border-[#292735] bg-[#171621] py-8" id="community">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-6 px-6 text-center sm:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={value}>
              <strong className="block font-['Plus_Jakarta_Sans'] text-2xl text-white">
                {value}
              </strong>
              <span className="mt-1 block text-[10px] text-[#858798]">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1100px] px-6 py-24" id="features">
        <div className="mx-auto max-w-[550px] text-center">
          <p className="text-[10px] font-bold tracking-[1.5px] text-[#9b82ff]">TẤT CẢ TRONG MỘT</p>
          <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white">
            Mọi công cụ để cộng đồng của bạn lớn mạnh
          </h2>
          <span className="mt-3 block text-sm leading-relaxed text-[#858798]">
            Từ trải nghiệm thành viên đến quản trị máy chủ, Suwa làm việc lặng lẽ để bạn tập trung
            vào điều quan trọng nhất.
          </span>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(([icon, title, description]) => (
            <article className="rounded-xl border border-[#302e3e] bg-[#1b1a27] p-5" key={title}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#7359df20] text-lg text-[#a894ff]">
                {icon}
              </div>
              <h3 className="mt-5 text-sm text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#858798]">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[800px] px-6 pb-24 text-center">
        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white">
          Sẵn sàng nâng cấp cộng đồng của bạn?
        </h2>
        <p className="mt-3 text-sm text-[#858798]">
          Bắt đầu sử dụng Suwa và cảm nhận sự khác biệt ngay hôm nay.
        </p>
        <Link
          className="mt-6 inline-block rounded-lg bg-[#8068ed] px-5 py-3 text-xs font-bold text-white no-underline"
          to={dashboardPath}
        >
          Thử Suwa ngay <span>→</span>
        </Link>
      </section>
      <footer className="flex justify-between border-t border-[#292735] px-6 py-6 text-[10px] text-[#77798a]">
        <span>© 2026 Suwa Bot. Made for communities.</span>
        <a href="#features">Tính năng</a>
      </footer>
    </main>
  );
}
