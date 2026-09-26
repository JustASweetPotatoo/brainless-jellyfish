import { Icon } from "../../core/UI";

export default function HeroCard({ serverName }: { serverName: string }) {
  return (
    <section className="panel-modifier hero-card-dasboard-modifier justify-between">
      <div className="relative z-10 max-w-130">
        <div className="inline-flex items-center gap-2 rounded-full border-color-modifier bg-[#735de0]/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.4px] text-[#c7b9ff]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#65e0a1] shadow-[0_0_0_3px_#65e0a11c]" />{" "}
          BOT ĐANG HOẠT ĐỘNG
        </div>
        <h2 className="m-0 mt-3 font-['Plus_Jakarta_Sans'] text-[clamp(22px,3vw,32px)] leading-tight tracking-[-1px] text-white">
          Chào buổi sáng, {serverName} <span>✦</span>
        </h2>
        <p className="m-0 mt-2 max-w-105 text-[11px] leading-relaxed text-[#b9b4d0]">
          Suwa đang bảo vệ và kết nối cộng đồng của bạn. Mọi thứ vận hành ổn định.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#8068ed] px-3.5 py-2 text-[10px] font-bold text-white shadow-[0_8px_18px_#4d3fae55]">
            Mời bot <Icon name="arrow" />
          </button>
          <button className="rounded-lg border border-[#675c88] bg-transparent px-3.5 py-2 text-[10px] font-bold text-[#d3ccef]">
            Xem hướng dẫn
          </button>
        </div>
      </div>
      <div
        className="relative mr-[8%] hidden h-37.5 w-37.5 items-center justify-center md:flex"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full border border-[#927aff55] rotate-12" />
        <div className="absolute inset-3 rounded-full border border-dashed border-[#927aff66] -rotate-12" />
        <div className="grid h-18 w-18 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#927aff,#6346d4)] text-[32px] font-extrabold text-white shadow-[0_12px_30px_#6048d466]">
          S
        </div>
        <span className="absolute right-1 top-3 text-lg text-[#c7b9ff]">✦</span>
        <span className="absolute bottom-3 left-1 text-sm text-[#c7b9ff]">✧</span>
      </div>
    </section>
  );
}
