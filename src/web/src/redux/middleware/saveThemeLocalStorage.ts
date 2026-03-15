import type { Middleware } from "@reduxjs/toolkit";
import { changeTheme } from "../reducer/slices/ThemeSlices";
import { LocalStorageKey } from "../../localStorage/storage";

export const saveThemeToLocalStorage: Middleware = (_store) => (next) => (action) => {
  const result = next(action);

  if (changeTheme.match(action)) {
    try {
      localStorage.setItem(LocalStorageKey.theme, JSON.stringify(action.payload));
    } catch (e) {
      console.warn("Lưu theme vào localStorage thất bại:", e);
    }
  }

  return result;
};
