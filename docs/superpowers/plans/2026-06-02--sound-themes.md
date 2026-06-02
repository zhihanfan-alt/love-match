# Love Match - Phase 3: Sound Effects & Theme Skins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sound effects and theme skins to the Love Match game.

**Architecture:** Programmatic sound generation using Web Audio API OscillatorNode for simple effects. Theme system with CSS variables and Canvas color overrides.

**Tech Stack:** Web Audio API, TypeScript, CSS Custom Properties

---

## File Structure

```
love-match/
├── src/
│   ├── audio/
│   │   ├── AudioManager.ts    # Updated with sound generation
│   │   └── SoundGenerator.ts  # Programmatic sound generation
│   ├── themes/
│   │   ├── Theme.ts           # Theme interface
│   │   ├── ThemeManager.ts    # Theme management
│   │   ├── DefaultTheme.ts    # Default romantic theme
│   │   ├── BegoniaTheme.ts    # Begonia theme
│   │   └── RoseTheme.ts       # Rose theme
│   └── ui/
│       ├── ThemeSelector.ts   # Theme selection UI
│       └── SettingsPanel.ts   # Settings panel with theme picker
└── styles/
    └── themes.css             # CSS theme variables
```

---

## Implementation Tasks

### Task 1: Sound Effects Generator

- [ ] **1.1 Create SoundGenerator class**

`src/audio/SoundGenerator.ts`:
```typescript
export class SoundGenerator {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  generateClick(): AudioBuffer {
    const duration = 0.1;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + 400 * Math.exp(-t * 20);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.3;
    }

    return buffer;
  }

  generateMatch(): AudioBuffer {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq1 = 523.25; // C5
      const freq2 = 659.25; // E5
      const freq3 = 783.99; // G5
      let sample = 0;

      if (t < 0.1) {
        sample = Math.sin(2 * Math.PI * freq1 * t) * (1 - t / 0.1);
      } else if (t < 0.2) {
        sample = Math.sin(2 * Math.PI * freq2 * (t - 0.1)) * (1 - (t - 0.1) / 0.1);
      } else {
        sample = Math.sin(2 * Math.PI * freq3 * (t - 0.2)) * (1 - (t - 0.2) / 0.1);
      }

      data[i] = sample * 0.3;
    }

    return buffer;
  }

  generateLevelComplete(): AudioBuffer {
    const duration = 1.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.2;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration);
      const noteT = t % noteDuration;

      if (noteIndex < notes.length) {
        const freq = notes[noteIndex];
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-noteT * 10) * 0.3;
      }
    }

    return buffer;
  }

  generateGameOver(): AudioBuffer {
    const duration = 0.8;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 400 - 200 * t;
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.3;
    }

    return buffer;
  }

  generateEasterEgg(): AudioBuffer {
    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + 400 * Math.sin(t * 10);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.2;
    }

    return buffer;
  }

  generateBGM(): AudioBuffer {
    const duration = 30;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const notes = [
      { freq: 261.63, start: 0, duration: 0.5 },  // C4
      { freq: 329.63, start: 0.5, duration: 0.5 },  // E4
      { freq: 392.00, start: 1.0, duration: 0.5 },  // G4
      { freq: 523.25, start: 1.5, duration: 0.5 },  // C5
    ];

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        const noteT = t % 2;
        if (noteT >= note.start && noteT < note.start + note.duration) {
          const localT = noteT - note.start;
          sample += Math.sin(2 * Math.PI * note.freq * t) * 
                   Math.exp(-localT * 5) * 0.1;
        }
      }

      left[i] = sample;
      right[i] = sample;
    }

    return buffer;
  }
}
```

- [ ] **1.2 Update AudioManager to use SoundGenerator**

Update `src/audio/AudioManager.ts`:
```typescript
import { SoundGenerator } from './SoundGenerator';

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted: boolean = false;
  private soundGenerator: SoundGenerator | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init(): Promise<void> {
    this.audioContext = new AudioContext();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.soundGenerator = new SoundGenerator(this.audioContext);
    this.generateSounds();
  }

  private generateSounds(): void {
    if (!this.soundGenerator) return;

    this.sounds.set('click', this.soundGenerator.generateClick());
    this.sounds.set('match', this.soundGenerator.generateMatch());
    this.sounds.set('level-complete', this.soundGenerator.generateLevelComplete());
    this.sounds.set('game-over', this.soundGenerator.generateGameOver());
    this.sounds.set('easter-egg', this.soundGenerator.generateEasterEgg());
    this.sounds.set('bgm', this.soundGenerator.generateBGM());
  }

  // ... rest of the methods remain the same
}
```

---

### Task 2: Theme System

- [ ] **2.1 Create Theme interface**

`src/themes/Theme.ts`:
```typescript
export interface Theme {
  id: string;
  name: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    text: string;
    textWhite: string;
    slotBg: string;
    border: string;
  };
  cardStyles: {
    heart: string;
    kiss: string;
    rose: string;
    begonia: string;
    star: string;
    moon: string;
    gift: string;
    gem: string;
  };
}
```

- [ ] **2.2 Create DefaultTheme**

`src/themes/DefaultTheme.ts`:
```typescript
import { Theme } from './Theme';

export const DefaultTheme: Theme = {
  id: 'default',
  name: '浪漫粉',
  icon: '💕',
  colors: {
    primary: '#FFB7C5',
    secondary: '#DDA0DD',
    accent: '#FF69B4',
    background: 'linear-gradient(135deg, #FFB7C5 0%, #DDA0DD 100%)',
    cardBg: '#FFFFFF',
    text: '#333333',
    textWhite: '#FFFFFF',
    slotBg: 'rgba(255,255,255,0.3)',
    border: '#FF69B4',
  },
  cardStyles: {
    heart: '💕',
    kiss: '😘',
    rose: '🌹',
    begonia: '🌸',
    star: '⭐',
    moon: '🌙',
    gift: '🎁',
    gem: '💎',
  },
};
```

- [ ] **2.3 Create BegoniaTheme**

`src/themes/BegoniaTheme.ts`:
```typescript
import { Theme } from './Theme';

export const BegoniaTheme: Theme = {
  id: 'begonia',
  name: '海棠红',
  icon: '🌸',
  colors: {
    primary: '#FF4D6D',
    secondary: '#FF8FA3',
    accent: '#FF1744',
    background: 'linear-gradient(135deg, #FF4D6D 0%, #FF8FA3 100%)',
    cardBg: '#FFF5F5',
    text: '#4A0E0E',
    textWhite: '#FFFFFF',
    slotBg: 'rgba(255,77,109,0.2)',
    border: '#FF1744',
  },
  cardStyles: {
    heart: '❤️',
    kiss: '💋',
    rose: '🌺',
    begonia: '🌸',
    star: '✨',
    moon: '🌛',
    gift: '🎀',
    gem: '🔴',
  },
};
```

- [ ] **2.4 Create RoseTheme**

`src/themes/RoseTheme.ts`:
```typescript
import { Theme } from './Theme';

export const RoseTheme: Theme = {
  id: 'rose',
  name: '玫瑰紫',
  icon: '🌹',
  colors: {
    primary: '#9C27B0',
    secondary: '#CE93D8',
    accent: '#7B1FA2',
    background: 'linear-gradient(135deg, #9C27B0 0%, #CE93D8 100%)',
    cardBg: '#F3E5F5',
    text: '#4A148C',
    textWhite: '#FFFFFF',
    slotBg: 'rgba(156,39,176,0.2)',
    border: '#7B1FA2',
  },
  cardStyles: {
    heart: '💜',
    kiss: '😻',
    rose: '🌹',
    begonia: '💮',
    star: '🌟',
    moon: '🌜',
    gift: '🎈',
    gem: '🔮',
  },
};
```

- [ ] **2.5 Create ThemeManager**

`src/themes/ThemeManager.ts`:
```typescript
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
```

- [ ] **2.6 Create CSS theme variables**

`styles/themes.css`:
```css
:root {
  --color-primary: #FFB7C5;
  --color-secondary: #DDA0DD;
  --color-accent: #FF69B4;
  --color-background: linear-gradient(135deg, #FFB7C5 0%, #DDA0DD 100%);
  --color-card-bg: #FFFFFF;
  --color-text: #333333;
  --color-text-white: #FFFFFF;
  --color-slot-bg: rgba(255,255,255,0.3);
  --color-border: #FF69B4;
}
```

---

### Task 3: UI Components

- [ ] **3.1 Create ThemeSelector**

`src/ui/ThemeSelector.ts`:
```typescript
import { ThemeManager } from '../themes/ThemeManager';
import { Theme } from '../themes/Theme';

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
        const themeId = btn.getAttribute('data-theme-id');
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
```

- [ ] **3.2 Create SettingsPanel**

`src/ui/SettingsPanel.ts`:
```typescript
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
              ${this.audioManager.isMuted ? '🔇' : '🔊'}
            </button>
            <span>${this.audioManager.isMuted ? '已静音' : '开启'}</span>
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
```

---

### Task 4: Integration

- [ ] **4.1 Update Game.ts to use theme system**

Add to `Game.ts`:
```typescript
import { ThemeManager } from '../themes/ThemeManager';
import { SettingsPanel } from '../ui/SettingsPanel';

// In Game class:
private themeManager: ThemeManager;
private settingsPanel: SettingsPanel;

constructor() {
  // ... existing code ...
  this.themeManager = ThemeManager.getInstance();
  this.settingsPanel = new SettingsPanel();
  document.body.appendChild(this.settingsPanel.getElement());
}

// In render():
render(): void {
  const theme = this.themeManager.getCurrentTheme();
  // Use theme.colors for rendering
  // ...
}
```

- [ ] **4.2 Add CSS styles for UI components**

`styles/ui.css`:
```css
.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-header h2 {
  margin: 0;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h3 {
  margin: 0 0 12px 0;
  color: var(--color-text);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-btn {
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.theme-btn:hover {
  transform: scale(1.05);
}

.theme-btn.active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.theme-icon {
  font-size: 24px;
}

.theme-name {
  font-size: 12px;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audio-btn {
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 20px;
}
```

---

### Task 5: Testing

- [ ] **5.1 Test sound effects**

1. Run the game
2. Click on cards - should hear click sound
3. Match 3 cards - should hear match sound
4. Complete level - should hear level complete sound
5. Game over - should hear game over sound
6. Trigger easter egg - should hear easter egg sound

- [ ] **5.2 Test theme system**

1. Click settings button
2. Select different themes
3. Verify colors change
4. Verify card icons change
5. Close settings
6. Verify theme persists

- [ ] **5.3 Commit and verify**

```bash
cd /c/Users/fsycbi001/love-match
npm run build
git add .
git commit -m "feat: add sound effects and theme skins"
```

---

## Success Criteria

1. Sound effects play for all interactions
2. Theme system works with 3 themes
3. Settings panel opens and closes
4. Theme selection persists
5. Game compiles and builds successfully
