import type { PlatformDesignTokens, ThemeMode } from "./types";
import { defaultTokens } from "./tokens";

export class ThemeEngine {
  private currentMode: ThemeMode = "dark";
  private tokens: PlatformDesignTokens;
  private listeners: Set<(tokens: PlatformDesignTokens) => void> = new Set();

  constructor(initialMode: ThemeMode = "dark") {
    this.currentMode = initialMode;
    this.tokens = defaultTokens[initialMode] ?? defaultTokens.dark;
  }

  public getMode(): ThemeMode {
    return this.currentMode;
  }

  public getTokens(): PlatformDesignTokens {
    return this.tokens;
  }

  public setMode(mode: ThemeMode): void {
    if (defaultTokens[mode]) {
      this.currentMode = mode;
      this.tokens = defaultTokens[mode];
      this.applyCSSVariables();
      this.notifyListeners();
    }
  }

  public applyCSSVariables(element: HTMLElement = document.documentElement): void {
    if (!element) return;
    const { colors, typography, borderRadius } = this.tokens;
    
    element.style.setProperty("--platform-bg", colors.background);
    element.style.setProperty("--platform-surface", colors.surface);
    element.style.setProperty("--platform-surface-border", colors.surfaceBorder);
    element.style.setProperty("--platform-primary", colors.primary);
    element.style.setProperty("--platform-text-primary", colors.textPrimary);
    element.style.setProperty("--platform-text-secondary", colors.textSecondary);
    element.style.setProperty("--platform-text-muted", colors.textMuted);
    element.style.setProperty("--platform-radius", borderRadius);
    element.style.setProperty("--platform-font-sans", typography.fontFamilySans);
    element.style.setProperty("--platform-font-mono", typography.fontFamilyMono);
  }

  public subscribe(listener: (tokens: PlatformDesignTokens) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn(this.tokens));
  }
}

export const globalThemeEngine = new ThemeEngine("dark");
