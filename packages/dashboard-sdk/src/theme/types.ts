export type ThemeMode = "dark" | "light" | "high-contrast" | "cyberpunk" | "emerald";

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  primaryForeground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface TypographyTokens {
  fontFamilySans: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeLg: string;
  fontSizeXl: string;
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  containerPadding: string;
  gridGap: string;
}

export interface PlatformDesignTokens {
  mode: ThemeMode;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borderRadius: string;
  shadow: string;
}
