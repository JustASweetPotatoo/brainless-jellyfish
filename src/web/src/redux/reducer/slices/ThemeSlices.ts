import { createSlice } from "@reduxjs/toolkit";
import { LocalStorageKey } from "../../../localStorage/storage";

export type ThemeState = {
  mode: "dark" | "light";
};

const initialState: ThemeState = {
  mode: "dark",
};

const getInitialTheme = (): ThemeState => {
  try {
    const stored = localStorage.getItem(LocalStorageKey.theme);
    return stored ? JSON.parse(stored) : { mode: "dark" };
  } catch {
    return { mode: "dark" };
  }
};

const themeSlice = createSlice({
  name: "themeSlice",
  initialState,
  reducers: {
    changeTheme: (state) => {
      state.mode == "dark" ? (state.mode = "light") : (state.mode = "dark");
    },
    initTheme: (state) => {
      state.mode = getInitialTheme().mode;
    },
  },
});

export const { changeTheme } = themeSlice.actions;
export default themeSlice;
