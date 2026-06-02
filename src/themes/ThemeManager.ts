import { Theme } from './Theme';
import { DefaultTheme } from './DefaultTheme';
import { BegoniaTheme } from './BegoniaTheme';
import { RoseTheme } from './RoseTheme';

export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme;

  private constructor() {
    this.registerTheme(DefaultTheme);
    this.registerTheme(BegoniaTheme);
    this.registerTheme(RoseTheme);
    this.currentTheme = DefaultTheme;
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  setTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.style.setProperty('--color-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--color-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--color-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--color-background', theme.colors.background);
    document.documentElement.style.setProperty('--color-card-bg', theme.colors.cardBg);
    document.documentElement.style.setProperty('--color-text', theme.colors.text);
    document.documentElement.style.setProperty('--color-text-white', theme.colors.textWhite);
    document.documentElement.style.setProperty('--color-slot-bg', theme.colors.slotBg);
    document.documentElement.style.setProperty('--color-border', theme.colors.border);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  getThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }
}
