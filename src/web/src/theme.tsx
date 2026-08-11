import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* =========================================================
   TYPES
========================================================= */

export type ColorMode = "light" | "dark";

export interface ColorTokens {
  grey: Record<number, string>;
  primary: Record<number, string>;
  greenAccent: Record<number, string>;
  redAccent: Record<number, string>;
  blueAccent: Record<number, string>;
}

/* =========================================================
   COLOR TOKENS
========================================================= */

export const tokens = (mode: ColorMode): ColorTokens => {
  if (mode === "dark") {
    return {
      grey: {
        100: "#e0e0e0",
        200: "#c2c2c2",
        300: "#a3a3a3",
        400: "#858585",
        500: "#666666",
        600: "#525252",
        700: "#3d3d3d",
        800: "#292929",
        900: "#141414",
      },

      primary: {
        100: "#d0d1d5",
        200: "#a1a4ab",
        300: "#727681",
        400: "#1F2A40",
        500: "#141b2d",
        600: "#101624",
        700: "#0c101b",
        800: "#080b12",
        900: "#040509",
      },

      greenAccent: {
        100: "#dbf5ee",
        200: "#b7ebde",
        300: "#94e2cd",
        400: "#70d8bd",
        500: "#4cceac",
        600: "#3da58a",
        700: "#2e7c67",
        800: "#1e5245",
        900: "#0f2922",
      },

      redAccent: {
        100: "#f8dcdb",
        200: "#f1b9b7",
        300: "#e99592",
        400: "#e2726e",
        500: "#db4f4a",
        600: "#af3f3b",
        700: "#832f2c",
        800: "#58201e",
        900: "#2c100f",
      },

      blueAccent: {
        100: "#e1e2fe",
        200: "#c3c6fd",
        300: "#a4a9fc",
        400: "#868dfb",
        500: "#6870fa",
        600: "#535ac8",
        700: "#3e4396",
        800: "#2a2d64",
        900: "#151632",
      },
    };
  }

  return {
    grey: {
      100: "#141414",
      200: "#292929",
      300: "#3d3d3d",
      400: "#525252",
      500: "#666666",
      600: "#858585",
      700: "#a3a3a3",
      800: "#c2c2c2",
      900: "#e0e0e0",
    },

    primary: {
      100: "#040509",
      200: "#080b12",
      300: "#0c101b",

      // Main content background
      400: "#f2f0f0",

      // Sidebar / navbar background
      500: "#ffffff",

      600: "#f5f5f5",
      700: "#e5e5e5",
      800: "#d6d6d6",
      900: "#c7c7c7",
    },

    greenAccent: {
      100: "#0f2922",
      200: "#1e5245",
      300: "#2e7c67",
      400: "#3da58a",
      500: "#4cceac",
      600: "#70d8bd",
      700: "#94e2cd",
      800: "#b7ebde",
      900: "#dbf5ee",
    },

    redAccent: {
      100: "#2c100f",
      200: "#58201e",
      300: "#832f2c",
      400: "#af3f3b",
      500: "#db4f4a",
      600: "#e2726e",
      700: "#e99592",
      800: "#f1b9b7",
      900: "#f8dcdb",
    },

    blueAccent: {
      100: "#151632",
      200: "#2a2d64",
      300: "#3e4396",
      400: "#535ac8",
      500: "#6870fa",
      600: "#868dfb",
      700: "#a4a9fc",
      800: "#c3c6fd",
      900: "#e1e2fe",
    },
  };
};

/* =========================================================
   COLOR MODE CONTEXT
========================================================= */

export interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "dark",

  toggleColorMode: () => {},
});

/* =========================================================
   USE COLOR MODE
========================================================= */

export function useColorMode() {
  return useContext(ColorModeContext);
}

/* =========================================================
   USE COLORS
========================================================= */

export function useColors() {
  const { mode } = useContext(ColorModeContext);

  return useMemo(() => tokens(mode), [mode]);
}

/* =========================================================
   USE MODE
========================================================= */

export function useMode() {
  const [mode, setMode] = useState<ColorMode>("dark");

  /* =======================================================
     COLOR MODE
  ======================================================== */

  const colorMode = useMemo<ColorModeContextValue>(
    () => ({
      mode,

      toggleColorMode() {
        setMode((prev) => (prev === "dark" ? "light" : "dark"));
      },
    }),
    [],
  );

  /* =======================================================
     TAILWIND DARK MODE
  ======================================================== */

  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle("dark", mode === "dark");

    /*
     * Hỗ trợ CSS thuần nếu cần
     */
    html.dataset.theme = mode;
  }, [mode]);

  /* =======================================================
     GLOBAL COLORS
  ======================================================== */

  const colors = useMemo(() => tokens(mode), [mode]);

  /*
   * Apply global CSS variables.
   *
   * Như vậy các component không cần
   * import useColors() vẫn có thể dùng:
   *
   * background-color: var(--color-primary-500);
   */

  useEffect(() => {
    const root = document.documentElement;

    Object.entries(colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--c-primary-${key}`, value);
    });

    Object.entries(colors.grey).forEach(([key, value]) => {
      root.style.setProperty(`--c-grey-${key}`, value);
    });

    Object.entries(colors.greenAccent).forEach(([key, value]) => {
      root.style.setProperty(`--c-green-${key}`, value);
    });

    Object.entries(colors.redAccent).forEach(([key, value]) => {
      root.style.setProperty(`--c-red-${key}`, value);
    });

    Object.entries(colors.blueAccent).forEach(([key, value]) => {
      root.style.setProperty(`--c-blue-${key}`, value);
    });
  }, [colors]);

  return {
    mode,
    colors,
    colorMode,

    /*
     * Giữ API cũ của bạn
     */
    theme: {
      palette: {
        mode,
      },
    },
  };
}

/* =========================================================
   THEME PROVIDER
========================================================= */

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorMode } = useMode();

  return <ColorModeContext.Provider value={colorMode}>{children}</ColorModeContext.Provider>;
}
