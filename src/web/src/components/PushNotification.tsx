import { useEffect, useState } from "react";

export type PushNotificationType = "warning" | "success" | "error";
export type PushNotificationData = {
  id: number;
  message: string;
  type: PushNotificationType;
};

type PushNotificationProps = {
  message: string;
  type: PushNotificationType;
  closing: boolean;
  onClose: () => void;
};

export default function PushNotification({
  message,
  type,
  closing,
  onClose,
}: PushNotificationProps) {
  const [entered, setEntered] = useState(false);
  const appearance = {
    success: {
      container: "border-[#65e0a155] bg-[#1b2b25] text-[#d8f7e7]",
      icon: "bg-[#65e0a122] text-[#65e0a1]",
      close: "text-[#9dcab0]",
      symbol: "✓",
    },
    warning: {
      container: "border-[#f2c66d66] bg-[#332b1c] text-[#fff1c9]",
      icon: "bg-[#f2c66d22] text-[#f2c66d]",
      close: "text-[#d7bc7d]",
      symbol: "!",
    },
    error: {
      container: "border-[#f2778566] bg-[#351f26] text-[#ffe0e4]",
      icon: "bg-[#f2778522] text-[#f27785]",
      close: "text-[#d99aa3]",
      symbol: "×",
    },
  }[type];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-3.5 py-3 shadow-[0_12px_30px_#00000033] ${appearance.container}`}
      style={{
        opacity: entered && !closing ? 1 : 0,
        transform: entered && !closing ? "translateX(0)" : "translateX(100%)",
        transition: "opacity 220ms ease-out, transform 220ms ease-out",
      }}
      role="status"
      aria-live="polite"
    >
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${appearance.icon}`}>
        {appearance.symbol}
      </span>
      <p className="m-0 min-w-0 flex-1 wrap-break-word text-xs">{message}</p>
      <button
        className={`grid h-6 w-6 place-items-center rounded-md border-0 bg-transparent hover:bg-[#ffffff12] hover:text-white ${appearance.close}`}
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}
