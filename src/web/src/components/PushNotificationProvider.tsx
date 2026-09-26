import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import PushNotification, {
  type PushNotificationData,
  type PushNotificationType,
} from "./PushNotification";

interface PushNotificationContextValue {
  notify: (message: string, type?: PushNotificationType) => void;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const [notifications, setNotifications] = useState<PushNotificationData[]>([]);
  const [closingIds, setClosingIds] = useState<Set<number>>(() => new Set());
  const sequence = useRef(0);
  const timers = useRef(new Map<number, { dismiss: number; remove?: number }>());

  const removeNotification = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer.dismiss);
      if (timer.remove !== undefined) window.clearTimeout(timer.remove);
      timers.current.delete(id);
    }
    setNotifications((items) => items.filter((item) => item.id !== id));
    setClosingIds((ids) => {
      const nextIds = new Set(ids);
      nextIds.delete(id);
      return nextIds;
    });
  }, []);

  const closeNotification = useCallback(
    (id: number) => {
      const timer = timers.current.get(id);
      if (!timer || timer.remove !== undefined) return;

      window.clearTimeout(timer.dismiss);
      setClosingIds((ids) => new Set(ids).add(id));
      timer.remove = window.setTimeout(() => removeNotification(id), 229);
    },
    [removeNotification],
  );

  const notify = useCallback(
    (message: string, type: PushNotificationType = "success") => {
      const id = ++sequence.current;
      setNotifications((items) => [{ id, message, type }, ...items]);
      const timer = { dismiss: 0 as number };
      timer.dismiss = window.setTimeout(() => closeNotification(id), 3280);
      timers.current.set(id, timer);
    },
    [closeNotification],
  );

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) {
        window.clearTimeout(timer.dismiss);
        if (timer.remove !== undefined) window.clearTimeout(timer.remove);
      }
      timers.current.clear();
    },
    [],
  );

  return (
    <PushNotificationContext.Provider value={{ notify }}>
      {children}
      {notifications.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-15 z-50 flex flex-col items-center gap-2 overflow-x-clip px-5 pt-3 sm:items-end sm:px-10">
          {notifications.map((notification) => (
            <PushNotification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              closing={closingIds.has(notification.id)}
              onClose={() => closeNotification(notification.id)}
            />
          ))}
        </div>
      )}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotification() {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error("usePushNotification must be used inside PushNotificationProvider");
  }
  return context;
}