import { createContext } from "react";
import type { PlatformDesignTokens, ThemeMode } from "./types";
import { globalThemeEngine } from "./ThemeEngine";

export interface ThemeContextValue {
  mode: ThemeMode;
  tokens: PlatformDesignTokens;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  tokens: globalThemeEngine.getTokens(),
  setMode: () => {},
});
