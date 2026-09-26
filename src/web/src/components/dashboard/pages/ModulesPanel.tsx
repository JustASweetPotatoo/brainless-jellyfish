import { moduleCategories } from "../core/moduleData";
import type { BotModule } from "../core/types";
import { Icon, Toggle } from "../core/UI";

export default function ModulesPanel({
  modules,
  onToggle,
}: {
  modules: BotModule[];
  onToggle: (id: string) => Promise<void> | void;
}) {
  return (
    <>
      <section className="mb-6 flex items-start gap-2.5 rounded-[10px] border border-[#7659df55] bg-[#7659df12] p-3 text-[11px] text-[#c7b9ff]">
        <span className="text-base">✦</span>
        <p className="m-0 leading-relaxed">
          Các thay đổi được áp dụng ngay lập tức. Một vài module có thể cần quyền riêng để hoạt động
          đầy đủ.
        </p>
      </section>
      <div className="grid gap-[30px]">
        {moduleCategories.map((category) => (
          <section key={category.title}>
            <div className="mb-3 ml-0.5 flex items-center gap-2.5">
              <span className="grid h-[29px] w-[29px] place-items-center rounded-lg bg-[#7659df25] text-sm text-[#c0aeff]">
                {category.icon}
              </span>
              <div>
                <h2 className="m-0 font-['Plus_Jakarta_Sans'] text-sm text-[var(--text-main)]">
                  {category.title}
                </h2>
                <p className="m-0 mt-0.5 text-[10px] text-[var(--muted)]">{category.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
              {modules
                .filter((module) => category.moduleIds.includes(module.id))
                .map((module) => (
                  <article
                    className="rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_10px_26px_var(--shadow-soft)]"
                    key={module.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-[10px] text-base ${module.tone === "purple" ? "bg-[#735de0]/20 text-[#a894ff]" : module.tone === "green" ? "bg-[#65e0a1]/15 text-[#65e0a1]" : module.tone === "orange" ? "bg-[#f1a45b]/15 text-[#f1a45b]" : "bg-[#5b9cf6]/15 text-[#78b1ff]"}`}
                      >
                        {module.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {module.pending ? (
                          <span className="text-xs" aria-label="Đang cập nhật module">
                            ⏳
                          </span>
                        ) : (
                          <span className="w-3 text-xs opacity-0" aria-hidden="true">
                            {" "}
                          </span>
                        )}
                        <Toggle
                          checked={module.enabled}
                          onClick={() => void onToggle(module.id)}
                          label={`Bật tắt ${module.name}`}
                          disabled={Boolean(module.pending)}
                        />
                      </div>
                    </div>
                    <h3 className="mb-1 mt-3 text-[13px] text-[var(--text-main)]">{module.name}</h3>
                    <p className="m-0 min-h-8 text-[10px] leading-relaxed text-[var(--muted)]">
                      {module.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--panel-border)] pt-3">
                      <span
                        className={`flex items-center gap-1.5 text-[9px] font-bold ${module.enabled ? "text-[#65e0a1]" : "text-[var(--muted)]"}`}
                      >
                        <i
                          className={`h-1.5 w-1.5 rounded-full ${module.enabled ? "bg-[#65e0a1]" : "bg-[var(--muted)]"}`}
                        />{" "}
                        {module.enabled ? "Đang hoạt động" : "Đang tạm dừng"}
                      </span>
                      <button className="inline-flex items-center gap-1 text-[10px] font-bold text-[#a894ff]">
                        Thiết lập <Icon name="arrow" size={12} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
