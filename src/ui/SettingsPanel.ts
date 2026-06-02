import { ThemeSelector } from './ThemeSelector';
import { AudioManager } from '../audio/AudioManager';

export class SettingsPanel {
  private container: HTMLDivElement;
  private themeSelector: ThemeSelector;
  private audioManager: AudioManager;
  private isOpen: boolean = false;

  constructor() {
    this.audioManager = AudioManager.getInstance();
    this.themeSelector = new ThemeSelector();
    this.container = document.createElement('div');
    this.container.className = 'settings-panel';
    this.container.style.display = 'none';
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h2>设置</h2>
          <button class="close-btn" id="close-settings">×</button>
        </div>
        <div class="settings-section">
          <h3>主题</h3>
          <div id="theme-selector-container"></div>
        </div>
        <div class="settings-section">
          <h3>音效</h3>
          <div class="audio-controls">
            <button id="toggle-mute" class="audio-btn">
              ${this.audioManager.getIsMuted() ? '🔇' : '🔊'}
            </button>
            <span>${this.audioManager.getIsMuted() ? '已静音' : '开启'}</span>
          </div>
        </div>
      </div>
    `;

    const themeContainer = this.container.querySelector('#theme-selector-container');
    if (themeContainer) {
      themeContainer.appendChild(this.themeSelector.getElement());
    }

    const closeBtn = this.container.querySelector('#close-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const muteBtn = this.container.querySelector('#toggle-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        const span = muteBtn.nextElementSibling;
        if (span) {
          span.textContent = isMuted ? '已静音' : '开启';
        }
      });
    }
  }

  open(): void {
    this.isOpen = true;
    this.container.style.display = 'flex';
  }

  close(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
