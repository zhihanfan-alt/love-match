import { ThemeManager } from '../themes/ThemeManager';

export class ThemeSelector {
  private container: HTMLDivElement;
  private themeManager: ThemeManager;

  constructor() {
    this.themeManager = ThemeManager.getInstance();
    this.container = document.createElement('div');
    this.container.className = 'theme-selector';
    this.render();
  }

  private render(): void {
    const themes = this.themeManager.getThemes();
    const currentTheme = this.themeManager.getCurrentTheme();

    this.container.innerHTML = `
      <div class="theme-grid">
        ${themes.map(theme => `
          <button
            class="theme-btn ${theme.id === currentTheme.id ? 'active' : ''}"
            data-theme-id="${theme.id}"
            style="background: ${theme.colors.primary}"
          >
            <span class="theme-icon">${theme.icon}</span>
            <span class="theme-name">${theme.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    this.container.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = (btn as HTMLElement).getAttribute('data-theme-id');
        if (themeId) {
          this.themeManager.setTheme(themeId);
          this.render();
        }
      });
    });
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
