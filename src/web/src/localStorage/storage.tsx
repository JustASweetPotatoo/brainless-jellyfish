import { useState, useEffect } from "react";

// Type for the custom hook
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // handle quota or security errors
    }
  }, [key, value]);

  return [value, setValue];
}

export const LocalStorageKey = {
  theme: "theme",
};
