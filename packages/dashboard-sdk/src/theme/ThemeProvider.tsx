import { useEffect, useState, useMemo, type ReactNode } from "react";
import type { PlatformDesignTokens, ThemeMode } from "./types";
import { globalThemeEngine } from "./ThemeEngine";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({
  children,
  defaultMode = "dark",
}: {
  children: ReactNode;
  defaultMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [tokens, setTokens] = useState<PlatformDesignTokens>(globalThemeEngine.getTokens());

  useEffect(() => {
    globalThemeEngine.setMode(defaultMode);
    globalThemeEngine.applyCSSVariables();

    const unsubscribe = globalThemeEngine.subscribe((newTokens) => {
      setTokens(newTokens);
      setModeState(newTokens.mode);
    });

    return unsubscribe;
  }, [defaultMode]);

  const handleSetMode = (newMode: ThemeMode) => {
    globalThemeEngine.setMode(newMode);
  };

  const value = useMemo(
    () => ({
      mode,
      tokens,
      setMode: handleSetMode,
    }),
    [mode, tokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
