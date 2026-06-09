import { Board } from './Board';
import { Slot } from './Slot';
import { Level } from './Level';
import { GameState, LevelConfig, CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TIMER_WARNING_SECONDS, TIMER_CRITICAL_SECONDS } from '../constants';
import { EasterEggManager } from '../easter-eggs/EasterEggManager';
import { PropManager } from '../props/PropManager';
import { AudioManager } from '../audio/AudioManager';
import { ThemeManager } from '../themes/ThemeManager';
import { SettingsPanel } from '../ui/SettingsPanel';
import { HelpPanel } from '../ui/HelpPanel';
import { animateShake, animateComboPopup, animateOverlayIn, gsap } from '../animation/GSAPAnimations';

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  fillStyle: string;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

interface ComboPopup {
  x: number;
  y: number;
  text: string;
  alpha: number;
  scale: number;
  combo: number;
}

interface SaveData {
  highestLevel: number;
  stars: Record<number, number>;
  highScores: Record<number, number>;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board!: Board;
  private slot!: Slot;
  private state: GameState = GameState.Menu;
  private currentLevel: number = 1;
  private currentConfig!: LevelConfig;
  private score: number = 0;
  private combo: number = 0;
  private lastTime: number = 0;
  private easterEggManager: EasterEggManager;
  private propManager: PropManager;
  private audioManager: AudioManager;
  private themeManager: ThemeManager;
  private settingsPanel: SettingsPanel;
  private helpPanel: HelpPanel;
  private settingsPanelElement: HTMLElement | null = null;
  private helpPanelElement: HTMLElement | null = null;
  private handleClickBound: (e: MouseEvent) => void;
  private handleTouchBound: (e: TouchEvent) => void;
  private initAudioBound: (() => void) | null = null;
  private hintTimer: number = 0;
  private isHintActive: boolean = false;

  // Timer
  private timeRemaining: number = 0;
  private timerActive: boolean = false;

  // Progress
  private totalCards: number = 0;

  // Stats
  private maxCombo: number = 0;
  private cardsCleared: number = 0;
  private timePlayed: number = 0;

  // Combo feedback (GSAP-powered)
  private shakeOffset = { x: 0, y: 0 };
  private comboPopups: ComboPopup[] = [];

  // Overlay animation (GSAP-powered)
  private overlay = { alpha: 0, scale: 0.8 };

  // State transition
  private transitionAlpha: number = 0;
  private transitionPhase: 'none' | 'fadeOut' | 'fadeIn' = 'none';
  private pendingState: GameState | null = null;
  private pendingCallback: (() => void) | null = null;

  // Snow particles
  private snowflakes: Snowflake[] = [];

  // Burst particles (combo/level-complete effects)
  private burstParticles: BurstParticle[] = [];

  // Screen flash effect
  private flashAlpha: number = 0;
  private flashColor: string = 'white';

  // Menu breathe animation
  private menuBreathe: number = 0;

  // Star animation for level complete
  private levelCompleteTime: number = 0;

  // Menu entrance animation
  private menuEnterTime: number = 0;

  // Custom difficulty config
  private customLayers: number = 6;
  private customBoardCols: number = 7;
  private customBoardRows: number = 8;
  private customCardSize: number = 50;
  private customSlotCount: number = 5;
  private customTimeLimitIndex: number = 0; // index into TIME_OPTIONS
  private customPropIndex: number = 1;      // index into PROP_OPTIONS

  private static readonly TIME_OPTIONS: (number | null)[] = [null, 60, 120, 180, 300];
  private static readonly TIME_LABELS: string[] = ['无限', '1:00', '2:00', '3:00', '5:00'];
  private static readonly PROP_OPTIONS: number[] = [0, 0.25, 0.5, 1.0];
  private static readonly PROP_LABELS: string[] = ['关', '0.25x', '0.5x', '1.0x'];

  // Custom config UI hit areas
  private customButtons: Array<{ x: number; y: number; w: number; h: number; action: string }> = [];

  // Level select button rects (computed in renderMenu)
  private levelButtons: Array<{ x: number; y: number; w: number; h: number; levelId: number }> = [];

  // Progress persistence
  private highestUnlockedLevel: number = 99;
  private levelStars: Record<number, number> = {};
  private levelHighScores: Record<number, number> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.easterEggManager = new EasterEggManager();
    this.propManager = new PropManager();
    this.audioManager = AudioManager.getInstance();
    this.initAudioOnInteraction();
    this.themeManager = ThemeManager.getInstance();
    this.themeManager.addListener(this.onThemeChanged.bind(this));
    this.settingsPanel = new SettingsPanel();
    this.settingsPanelElement = this.settingsPanel.getElement();
    document.body.appendChild(this.settingsPanelElement);

    this.helpPanel = new HelpPanel();
    this.helpPanelElement = this.helpPanel.getElement();
    document.body.appendChild(this.helpPanelElement);

    this.handleClickBound = this.handleClick.bind(this);
    this.handleTouchBound = this.handleTouch.bind(this);

    this.setupCanvas();
    this.setupEventListeners();
    this.initSnowflakes();
    this.loadProgress();
    this.menuEnterTime = performance.now();
  }

  private initSnowflakes(): void {
    const heartEmojis = ['❤️', '💕', '💖', '💗', '✨', '⭐', '🌟', '💫'];
    for (let i = 0; i < 35; i++) {
      const opacity = Math.random() * 0.5 + 0.15;
      this.snowflakes.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 10 + 8,
        speed: Math.random() * 0.6 + 0.3,
        opacity,
        fillStyle: `rgba(255, 255, 255, ${opacity})`,
        emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    }
  }

  private updateSnowflakes(deltaTime: number): void {
    for (let i = 0; i < this.snowflakes.length; i++) {
      const flake = this.snowflakes[i];
      flake.y += flake.speed * deltaTime * 60;
      flake.x += Math.sin(flake.y * 0.008) * 0.6;
      flake.rotation += flake.rotationSpeed;
      if (flake.y > CANVAS_HEIGHT + 15) {
        flake.y = -20;
        flake.x = Math.random() * CANVAS_WIDTH;
      }
    }
  }

  private renderSnowflakes(): void {
    this.ctx.save();
    for (let i = 0; i < this.snowflakes.length; i++) {
      const flake = this.snowflakes[i];
      this.ctx.globalAlpha = flake.opacity;
      this.ctx.save();
      this.ctx.translate(flake.x, flake.y);
      this.ctx.rotate(flake.rotation);
      this.ctx.font = `${flake.size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(flake.emoji, 0, 0);
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  /** Spawn burst particles at a given position */
  private spawnBurst(x: number, y: number, count: number, speed: number = 3): void {
    const emojis = ['❤️', '💕', '💖', '✨', '⭐', '🌟', '💫', '💗'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const v = speed * (0.6 + Math.random() * 0.8);
      this.burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 1,
        size: 10 + Math.random() * 8,
        alpha: 1,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        life: 1,
      });
    }
  }

  /** Spawn rain from top for level complete */
  private spawnRain(count: number): void {
    const emojis = ['❤️', '💕', '💖', '✨', '⭐', '🌟', '💗', '💎'];
    for (let i = 0; i < count; i++) {
      this.burstParticles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2 + Math.random() * 2,
        size: 12 + Math.random() * 10,
        alpha: 0.8 + Math.random() * 0.2,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        life: 1,
      });
    }
  }

  private updateBurstParticles(deltaTime: number): void {
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;
      p.vy += 0.05 * deltaTime * 60; // gravity
      p.rotation += p.rotationSpeed;
      p.life -= deltaTime * 0.7;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.burstParticles.splice(i, 1);
      }
    }
  }

  private renderBurstParticles(): void {
    this.ctx.save();
    for (const p of this.burstParticles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.font = `${p.size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.emoji, 0, 0);
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  private onThemeChanged(): void {
    this.render();
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClickBound);
    this.canvas.addEventListener('touchstart', this.handleTouchBound);
  }

  private initAudioOnInteraction(): void {
    const initAudio = async () => {
      await this.audioManager.init();
      if (this.initAudioBound) {
        this.canvas.removeEventListener('click', this.initAudioBound);
        this.canvas.removeEventListener('touchstart', this.initAudioBound);
        this.initAudioBound = null;
      }
    };
    this.initAudioBound = initAudio;
    this.canvas.addEventListener('click', initAudio);
    this.canvas.addEventListener('touchstart', initAudio);
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    this.handleInteraction(x, y);
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    this.handleInteraction(x, y);
  }

  private handleInteraction(x: number, y: number): void {
    // Block interactions during transitions
    if (this.transitionPhase !== 'none') return;

    // Settings button (any state)
    if (x >= CANVAS_WIDTH - 55 && x <= CANVAS_WIDTH - 15 && y >= 15 && y <= 55) {
      this.settingsPanel.toggle();
      return;
    }

    // Menu: level select
    if (this.state === GameState.Menu) {
      // Check help button
      const helpBtnY = CANVAS_HEIGHT / 2 + 220;
      if (x >= CANVAS_WIDTH / 2 - 65 && x <= CANVAS_WIDTH / 2 + 65 && y >= helpBtnY && y <= helpBtnY + 42) {
        this.helpPanel.toggle();
        return;
      }

      // Check level buttons
      for (const btn of this.levelButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.levelId === -1) {
            this.transitionToState(GameState.Custom);
          } else {
            this.transitionToState(GameState.Playing, () => this.startLevel(btn.levelId));
          }
          return;
        }
      }
      return;
    }

    // Custom config screen
    if (this.state === GameState.Custom) {
      for (const btn of this.customButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.handleCustomAction(btn.action);
          return;
        }
      }
      return;
    }

    // Game Over: check buttons
    if (this.state === GameState.GameOver) {
      const btnW = 180;
      const btnH = 50;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      const restartY = CANVAS_HEIGHT / 2 + 80;
      const menuY = CANVAS_HEIGHT / 2 + 150;

      if (x >= btnX && x <= btnX + btnW && y >= restartY && y <= restartY + btnH) {
        if (this.currentLevel === 99) {
          this.startCustomLevel();
        } else {
          this.transitionToState(GameState.Playing, () => this.startLevel(this.currentLevel));
        }
        return;
      }
      if (x >= btnX && x <= btnX + btnW && y >= menuY && y <= menuY + btnH) {
        this.transitionToState(GameState.Menu);
        return;
      }
      return;
    }

    // Level Complete: check button
    if (this.state === GameState.LevelComplete) {
      const btnW = 200;
      const btnH = 52;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      const btnY = CANVAS_HEIGHT / 2 + 100;

      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= Level.getTotalLevels()) {
          this.transitionToState(GameState.Playing, () => this.startLevel(nextLevel));
        } else {
          this.transitionToState(GameState.Menu);
        }
        return;
      }
      return;
    }

    // Paused: check buttons
    if (this.state === GameState.Paused) {
      const btnW = 190;
      const btnH = 50;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      const continueY = CANVAS_HEIGHT / 2 + 20;
      const menuY = CANVAS_HEIGHT / 2 + 90;

      if (x >= btnX && x <= btnX + btnW && y >= continueY && y <= continueY + btnH) {
        this.togglePause();
        return;
      }
      if (x >= btnX && x <= btnX + btnW && y >= menuY && y <= menuY + btnH) {
        this.transitionToState(GameState.Menu);
        return;
      }
      return;
    }

    if (this.state !== GameState.Playing) return;

    // Control buttons
    const buttonSize = 44;
    const buttonY = 18;
    const buttonGap = 10;

    const pauseX = 20;
    if (x >= pauseX && x <= pauseX + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      this.togglePause();
      return;
    }

    const menuX = pauseX + buttonSize + buttonGap;
    if (x >= menuX && x <= menuX + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      this.transitionToState(GameState.Menu);
      return;
    }

    // Props bar
    const props = this.propManager.getProps();
    const propsY = this.getPropsY();
    const propSize = 46;
    const gap = 8;
    const totalWidth = props.length * (propSize + gap) - gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    for (let i = 0; i < props.length; i++) {
      const propX = startX + i * (propSize + gap);
      if (x >= propX && x <= propX + propSize && y >= propsY && y <= propsY + propSize) {
        this.useProp(props[i].getId());
        return;
      }
    }

    const card = this.board.getCardAtPosition(x, y);
    if (!card) return;

    card.triggerRipple();
    card.playClickAnimation();

    const added = this.slot.addCard(card);
    if (!added) return;

    this.board.removeCard(card);
    this.audioManager.playSound('click');

    this.checkMatches();

    // Slot danger feedback
    if (this.slot.checkDangerEscalated()) {
      const danger = this.slot.getDangerLevel();
      if (danger >= 2) {
        this.flashAlpha = 0.15;
        this.flashColor = 'rgba(255,60,60,';
        this.audioManager.playSound('game-over');
      } else if (danger >= 1) {
        this.flashAlpha = 0.08;
        this.flashColor = 'rgba(255,165,0,';
      }
    }

    if (this.slot.isFull()) {
      this.gameOver();
    }
  }

  private checkMatches(): void {
    const cards = this.slot.getCards();
    if (cards.length === 0) return;
    const lastCard = cards[cards.length - 1];
    const matching = cards.filter(c => c.type === lastCard.type);

    if (matching.length >= 3) {
      this.slot.removeCards(lastCard.type);
      this.cardsCleared += 3;

      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const comboMultiplier = Math.min(this.combo, 5);
      const baseScore = 100;
      const comboBonus = baseScore * comboMultiplier;
      this.score += comboBonus;

      // Combo feedback (GSAP-powered)
      if (this.combo >= 2) {
        const intensity = Math.min(this.combo * 2.5, 12);
        animateShake(this.shakeOffset, intensity);
        const popup: ComboPopup = {
          x: CANVAS_WIDTH / 2,
          y: this.getSlotY() - 30,
          text: `${this.combo}连击! +${comboBonus}`,
          alpha: 1,
          scale: 1 + Math.min(this.combo * 0.1, 0.5),
          combo: this.combo,
        };
        this.comboPopups.push(popup);
        animateComboPopup(popup, popup.y);

        // Combo burst particles — more for higher combos
        const burstCount = 8 + this.combo * 3;
        this.spawnBurst(CANVAS_WIDTH / 2, this.getSlotY(), Math.min(burstCount, 25), 3);

        // Screen flash for high combos
        if (this.combo >= 4) {
          this.flashAlpha = 0.12;
          this.flashColor = 'rgba(255,255,255,';
        }
        if (this.combo >= 6) {
          // Full-screen colored burst
          this.spawnBurst(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20, 5);
          this.spawnBurst(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 10, 4);
          this.spawnBurst(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT / 2, 10, 4);
        }
      }

      this.easterEggManager.trigger(lastCard.type, this.combo);
      this.audioManager.playSound('match');

      if (this.board.getCards().length === 0) {
        this.levelComplete();
      }
    } else {
      this.combo = 0;
    }
  }

  private getBoardStartY(): number {
    return 75;
  }

  private getSlotY(): number {
    const boardHeight = this.currentConfig.boardRows * (this.currentConfig.cardSize + this.currentConfig.cardGap) - this.currentConfig.cardGap;
    return this.getBoardStartY() + boardHeight + 20;
  }

  private getPropsY(): number {
    return this.getSlotY() + 75;
  }

  startLevel(levelId: number): void {
    this.currentLevel = levelId;
    this.currentConfig = Level.getLevel(levelId);

    if (levelId === 1) {
      this.score = 0;
      this.combo = 0;
    }

    const boardStartY = this.getBoardStartY();
    const cardGap = this.currentConfig.cardGap;

    this.board = new Board({
      layers: this.currentConfig.layers,
      cardTypes: this.currentConfig.cardTypes,
      boardCols: this.currentConfig.boardCols,
      boardRows: this.currentConfig.boardRows,
      cardSize: this.currentConfig.cardSize,
      cardGap,
      boardStartY,
    });
    this.board.generate();
    this.totalCards = this.board.getTotalCount();

    const slotY = this.getSlotY();
    this.slot = new Slot(this.currentConfig.slotCount, this.currentConfig.cardSize, slotY);

    this.propManager.resetAll();
    this.propManager.applyUsesMultiplier(this.currentConfig.propUsesMultiplier);

    // Timer
    if (this.currentConfig.timeLimit !== null) {
      this.timeRemaining = this.currentConfig.timeLimit;
      this.timerActive = true;
    } else {
      this.timerActive = false;
      this.timeRemaining = 0;
    }

    // Reset stats
    this.maxCombo = 0;
    this.cardsCleared = 0;
    this.timePlayed = 0;
    this.comboPopups = [];
    this.shakeOffset.x = 0;
    this.shakeOffset.y = 0;

    this.state = GameState.Playing;
  }

  private levelComplete(): void {
    this.state = GameState.LevelComplete;
    this.levelCompleteTime = performance.now();
    this.audioManager.playSound('level-complete');
    animateOverlayIn(this.overlay);

    // Victory particle rain
    this.spawnRain(30);

    // Compute stars (1-3)
    const stars = this.computeStars();

    // Save progress
    if (this.currentLevel >= this.highestUnlockedLevel) {
      this.highestUnlockedLevel = Math.min(this.currentLevel + 1, Level.getTotalLevels());
    }
    this.levelStars[this.currentLevel] = Math.max(this.levelStars[this.currentLevel] ?? 0, stars);
    this.levelHighScores[this.currentLevel] = Math.max(this.levelHighScores[this.currentLevel] ?? 0, this.score);
    this.saveProgress();
  }

  private computeStars(): number {
    const remaining = this.board.getRemainingCount();
    const progress = remaining === 0 ? 1 : 0;
    const timeBonus = this.currentConfig.timeLimit
      ? (this.timeRemaining / this.currentConfig.timeLimit)
      : 0.5;
    const comboBonus = Math.min(this.maxCombo / 5, 1);

    const rating = progress * 0.4 + timeBonus * 0.3 + comboBonus * 0.3;
    if (rating >= 0.75) return 3;
    if (rating >= 0.45) return 2;
    return 1;
  }

  private gameOver(): void {
    this.state = GameState.GameOver;
    this.audioManager.playSound('game-over');
    animateOverlayIn(this.overlay);
  }

  private togglePause(): void {
    if (this.state === GameState.Playing) {
      this.state = GameState.Paused;
    } else if (this.state === GameState.Paused) {
      this.state = GameState.Playing;
    }
  }

  private transitionToState(newState: GameState, callback?: () => void): void {
    if (this.transitionPhase !== 'none') return;
    this.transitionPhase = 'fadeOut';
    this.pendingState = newState;
    this.pendingCallback = callback ?? null;
    if (newState === GameState.Menu || newState === GameState.Custom) {
      this.menuEnterTime = performance.now();
    }
  }

  private useProp(propId: string): void {
    const cards = this.slot.getCards();
    const success = this.propManager.useProp(propId, this.board, this.slot, cards);
    if (success) {
      this.audioManager.playSound('click');
      if (propId === 'hint') {
        this.isHintActive = true;
        this.hintTimer = 3;
      }
    } else {
      this.audioManager.playSound('game-over');
    }
  }

  update(timestamp: number): void {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return;
    }

    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.updateSnowflakes(deltaTime);
    this.updateBurstParticles(deltaTime);

    // Flash fade
    if (this.flashAlpha > 0) {
      this.flashAlpha -= deltaTime * 4;
      if (this.flashAlpha < 0) {
        this.flashAlpha = 0;
        this.flashColor = 'rgba(255,255,255,';
      }
    }

    // State transition animation
    if (this.transitionPhase === 'fadeOut') {
      this.transitionAlpha += deltaTime * 3.5;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        this.transitionPhase = 'fadeIn';
        if (this.pendingState !== null) {
          this.state = this.pendingState;
        }
        if (this.pendingCallback) {
          this.pendingCallback();
          this.pendingCallback = null;
        }
        this.pendingState = null;
      }
    } else if (this.transitionPhase === 'fadeIn') {
      this.transitionAlpha -= deltaTime * 3.5;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitionPhase = 'none';
      }
    }

    // Menu breathe
    this.menuBreathe += deltaTime;

    // Clean up finished combo popups
    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      if (this.comboPopups[i].alpha <= 0.01) {
        this.comboPopups.splice(i, 1);
      }
    }

    if (this.state === GameState.Playing) {
      this.board.update(deltaTime);
      this.easterEggManager.update(deltaTime);
      this.propManager.update(deltaTime);
      this.timePlayed += deltaTime;

      // Timer
      if (this.timerActive) {
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.gameOver();
        }
      }

      // Hint timer
      if (this.isHintActive) {
        this.hintTimer -= deltaTime;
        if (this.hintTimer <= 0) {
          this.isHintActive = false;
          this.resetHintHighlight();
        }
      }
    }
  }

  private resetHintHighlight(): void {
    const cards = this.board.getCards();
    cards.forEach(card => card.setScale(1));
  }

  render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    const theme = this.themeManager.getCurrentTheme();
    const gradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, theme.colors.primary);
    gradient.addColorStop(1, theme.colors.secondary);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.renderSnowflakes();

    if (this.state === GameState.Menu) {
      this.renderMenu();
      return;
    }

    if (this.state === GameState.Custom) {
      this.renderCustomConfig();
      return;
    }

    // Apply screen shake (GSAP-driven)
    if ((this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) && this.state === GameState.Playing) {
      this.ctx.save();
      this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    }

    if (this.state === GameState.Playing || this.state === GameState.Paused) {
      this.board.render(this.ctx);
      this.slot.render(this.ctx);
      this.renderHUD();
      this.renderPropsBar();
      this.renderControlButtons();
      this.easterEggManager.render(this.ctx);
      this.renderComboPopups();
      this.renderBurstParticles();

      // Combo/danger flash overlay
      if (this.flashAlpha > 0 && this.state === GameState.Playing) {
        this.ctx.fillStyle = `${this.flashColor}${this.flashAlpha})`;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }

    if ((this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) && this.state === GameState.Playing) {
      this.ctx.restore();
    }

    if (this.state === GameState.GameOver) {
      this.board.render(this.ctx);
      this.slot.render(this.ctx);
      this.renderGameOver();
    }

    if (this.state === GameState.LevelComplete) {
      this.renderLevelComplete();
      this.renderBurstParticles();
    }

    if (this.state === GameState.Paused) {
      this.renderPauseOverlay();
    }

    // State transition overlay
    if (this.transitionAlpha > 0) {
      this.ctx.fillStyle = `rgba(0,0,0,${this.transitionAlpha})`;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  private renderHUD(): void {
    this.ctx.save();

    const hudY = 72;

    // Level name (left) with icon
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentConfig.name, 20, hudY);

    // Score (center) with sparkle icon
    this.ctx.textAlign = 'center';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('✨', CANVAS_WIDTH / 2 - 30, hudY);
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.fillText(`${this.score}`, CANVAS_WIDTH / 2 + 8, hudY);

    // Timer (right) — with arc progress ring
    if (this.timerActive) {
      const mins = Math.floor(this.timeRemaining / 60);
      const secs = Math.floor(this.timeRemaining % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const timerX = CANVAS_WIDTH - 65;
      const timerRatio = this.currentConfig.timeLimit
        ? this.timeRemaining / this.currentConfig.timeLimit
        : 1;

      // Arc progress ring
      const ringR = 18;
      const ringCx = timerX - 30;
      const ringCy = hudY;

      // Track
      this.ctx.beginPath();
      this.ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, Math.PI * 1.5);
      this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Fill arc
      const arcEnd = -Math.PI / 2 + timerRatio * Math.PI * 2;
      let arcColor: string;
      if (this.timeRemaining < TIMER_CRITICAL_SECONDS) {
        arcColor = '#ff4444';
      } else if (this.timeRemaining < TIMER_WARNING_SECONDS) {
        arcColor = '#fbbf24';
      } else {
        arcColor = '#4ade80';
      }
      this.ctx.beginPath();
      this.ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, arcEnd);
      this.ctx.strokeStyle = arcColor;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Glow on arc end
      if (timerRatio > 0.02) {
        this.ctx.shadowColor = arcColor;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(ringCx, ringCy, ringR, arcEnd - 0.1, arcEnd);
        this.ctx.strokeStyle = arcColor;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      // Timer text — with pulsing effect for critical
      if (this.timeRemaining < TIMER_CRITICAL_SECONDS) {
        const pulse = 0.7 + Math.sin(this.menuBreathe * 6) * 0.3;
        this.ctx.fillStyle = `rgba(255,68,68,${pulse})`;
        this.ctx.font = 'bold 20px PingFang SC';
      } else if (this.timeRemaining < TIMER_WARNING_SECONDS) {
        this.ctx.fillStyle = COLORS.star;
        this.ctx.font = 'bold 18px PingFang SC';
      } else {
        this.ctx.fillStyle = COLORS.textWhite;
        this.ctx.font = '18px PingFang SC';
      }
      this.ctx.textAlign = 'left';
      this.ctx.fillText(timeStr, timerX - 6, hudY);
    }

    // Progress bar — blue-to-pink gradient with rounded ends
    const barY = hudY + 16;
    const barW = CANVAS_WIDTH - 40;
    const barH = 5;
    const progress = this.totalCards > 0 ? 1 - (this.board.getRemainingCount() / this.totalCards) : 0;

    // Track
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.beginPath();
    this.ctx.roundRect(20, barY, barW, barH, barH / 2);
    this.ctx.fill();

    // Fill
    if (progress > 0) {
      const grad = this.ctx.createLinearGradient(20, barY, 20 + barW, barY);
      grad.addColorStop(0, '#4facfe');
      grad.addColorStop(0.5, '#c084fc');
      grad.addColorStop(1, '#ff6b9d');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.roundRect(20, barY, barW * progress, barH, barH / 2);
      this.ctx.fill();

      // Glow on leading edge
      this.ctx.shadowColor = '#ff6b9d';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(20 + barW * progress, barY + barH / 2, barH / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff6b9d';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Combo text — scaled and stroked, dynamic sizing
    if (this.combo > 1) {
      const comboScale = 1 + Math.min(this.combo * 0.05, 0.35);
      const comboFontSize = this.combo >= 4 ? 20 : 16;
      this.ctx.save();
      this.ctx.translate(CANVAS_WIDTH / 2, barY + 18);
      this.ctx.scale(comboScale, comboScale);
      this.ctx.font = `bold ${comboFontSize}px PingFang SC`;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`${this.combo}连击`, 0, 0);
      if (this.combo >= 4) {
        const grad = this.ctx.createLinearGradient(-30, 0, 30, 0);
        grad.addColorStop(0, '#ff6b9d');
        grad.addColorStop(0.5, '#fbbf24');
        grad.addColorStop(1, '#818cf8');
        this.ctx.fillStyle = grad;
      } else {
        this.ctx.fillStyle = COLORS.star;
      }
      this.ctx.fillText(`${this.combo}连击`, 0, 0);
      this.ctx.restore();
    }

    // Hint indicator
    if (this.isHintActive) {
      this.ctx.font = '14px PingFang SC';
      this.ctx.fillStyle = COLORS.star;
      this.ctx.textAlign = 'center';
      this.ctx.fillText('💡 提示中...', CANVAS_WIDTH / 2, barY + 36);
    }

    this.ctx.restore();
  }

  private renderPropsBar(): void {
    const props = this.propManager.getProps();
    const propsY = this.getPropsY();
    const propSize = 46;
    const gap = 8;
    const totalWidth = props.length * (propSize + gap) - gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    this.ctx.save();

    // Bar background — glassmorphism
    const barBg = this.ctx.createLinearGradient(startX - 8, propsY - 8, startX - 8, propsY + propSize + 12);
    barBg.addColorStop(0, 'rgba(255,255,255,0.14)');
    barBg.addColorStop(1, 'rgba(100,200,255,0.06)');
    this.ctx.fillStyle = barBg;
    this.ctx.beginPath();
    this.ctx.roundRect(startX - 8, propsY - 8, totalWidth + 16, propSize + 20, 12);
    this.ctx.fill();

    // Subtle border
    this.ctx.strokeStyle = 'rgba(100,200,255,0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    const now = performance.now() / 1000;

    props.forEach((prop, index) => {
      const x = startX + index * (propSize + gap);
      const isAvailable = prop.isAvailable();

      // Glow background for available props
      if (isAvailable) {
        this.ctx.shadowColor = 'rgba(100,200,255,0.5)';
        this.ctx.shadowBlur = 10;
      }

      this.ctx.fillStyle = isAvailable
        ? 'rgba(100,200,255,0.35)'
        : 'rgba(200,200,200,0.2)';
      this.ctx.beginPath();
      this.ctx.roundRect(x, propsY, propSize, propSize, 10);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Border
      this.ctx.strokeStyle = isAvailable
        ? 'rgba(100,200,255,0.5)'
        : 'rgba(200,200,200,0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Cooldown wave effect
      const cdPercent = prop.getCooldownPercent();
      if (cdPercent > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x, propsY, propSize, propSize, 10);
        this.ctx.clip();

        // Wave fill from bottom
        const waveY = propsY + propSize * (1 - cdPercent);
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, waveY);
        for (let wx = x; wx <= x + propSize; wx += 2) {
          const wave = Math.sin((wx - x) * 0.3 + now * 4) * 2;
          this.ctx.lineTo(wx, waveY + wave);
        }
        this.ctx.lineTo(x + propSize, propsY + propSize);
        this.ctx.lineTo(x, propsY + propSize);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }

      // Icon with pulse for available props
      const pulseScale = isAvailable ? 1 + Math.sin(now * 3 + index) * 0.04 : 1;
      this.ctx.save();
      this.ctx.translate(x + propSize / 2, propsY + propSize / 2);
      this.ctx.scale(pulseScale, pulseScale);

      this.ctx.font = '22px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = isAvailable ? COLORS.textWhite : 'rgba(255,255,255,0.4)';
      this.ctx.fillText(prop.getIcon(), 0, 0);
      this.ctx.restore();

      // Uses count
      this.ctx.font = 'bold 11px PingFang SC';
      this.ctx.fillStyle = isAvailable ? 'rgba(100,200,255,0.9)' : 'rgba(200,200,200,0.5)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${prop.getUsesLeft()}`, x + propSize / 2, propsY + propSize + 8);
    });

    this.ctx.restore();
  }

  private renderControlButtons(): void {
    const buttonSize = 44;
    const buttonY = 18;
    const buttonGap = 10;

    this.ctx.save();

    // Pause button
    const pauseX = 20;
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(pauseX, buttonY, buttonSize, buttonSize, 22);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.state === GameState.Paused ? '▶' : '⏸', pauseX + buttonSize / 2, buttonY + buttonSize / 2);

    // Menu button
    const menuX = pauseX + buttonSize + buttonGap;
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(menuX, buttonY, buttonSize, buttonSize, 22);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('🏠', menuX + buttonSize / 2, buttonY + buttonSize / 2);

    this.ctx.restore();
  }

  private renderComboPopups(): void {
    this.ctx.save();
    for (const popup of this.comboPopups) {
      if (popup.alpha <= 0.01) continue;
      this.ctx.globalAlpha = popup.alpha;
      this.ctx.save();
      this.ctx.translate(popup.x, popup.y);
      this.ctx.scale(popup.scale, popup.scale);

      // Dynamic font size based on combo level
      const fontSize = popup.combo >= 6 ? 40 : popup.combo >= 4 ? 34 : 28;
      this.ctx.font = `bold ${fontSize}px PingFang SC`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Stroke for readability
      this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      this.ctx.lineWidth = 5;
      this.ctx.strokeText(popup.text, 0, 0);

      // Fill — rainbow gradient for 4+ combos
      if (popup.combo >= 4) {
        const grad = this.ctx.createLinearGradient(-80, 0, 80, 0);
        grad.addColorStop(0, '#ff6b9d');
        grad.addColorStop(0.25, '#fbbf24');
        grad.addColorStop(0.5, '#34d399');
        grad.addColorStop(0.75, '#818cf8');
        grad.addColorStop(1, '#ff6b9d');
        this.ctx.fillStyle = grad;
      } else {
        this.ctx.fillStyle = COLORS.star;
      }
      this.ctx.fillText(popup.text, 0, 0);

      this.ctx.restore();
    }
    this.ctx.restore();
  }

  private renderMenu(): void {
    this.ctx.save();

    const breathe = 15 + Math.sin(this.menuBreathe * 2) * 8;

    // Menu entrance animation timing
    const menuElapsed = (performance.now() - this.menuEnterTime) / 1000;
    const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(t, 1), 3);

    // Title with breathing glow — slides in from top
    const titleProgress = easeOut(menuElapsed / 0.5);
    const titleOffsetY = (1 - titleProgress) * -60;
    this.ctx.globalAlpha = titleProgress;

    this.ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
    this.ctx.shadowBlur = breathe;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 48px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.strokeStyle = 'rgba(100,200,255,0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('爱心消消乐', CANVAS_WIDTH / 2, 160 + titleOffsetY);
    this.ctx.fillText('爱心消消乐', CANVAS_WIDTH / 2, 160 + titleOffsetY);
    this.ctx.shadowBlur = 0;

    // Subtitle
    const subtitleProgress = easeOut((menuElapsed - 0.15) / 0.4);
    this.ctx.globalAlpha = subtitleProgress;
    this.ctx.font = '16px PingFang SC';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    this.ctx.fillText('✨ 极光下的浪漫消除 ✨', CANVAS_WIDTH / 2, 200 + titleOffsetY);

    // Decorative heart
    this.ctx.font = '30px Arial';
    this.ctx.globalAlpha = (0.5 + Math.sin(this.menuBreathe * 1.5) * 0.2) * titleProgress;
    this.ctx.fillText('💕', CANVAS_WIDTH / 2, 110 + titleOffsetY);
    this.ctx.globalAlpha = 1;

    // Level buttons — glassmorphism style with staggered entrance
    this.levelButtons = [];
    const levels = Level.getAllLevels();
    const btnW = 270;
    const btnH = 48;
    const btnX = (CANVAS_WIDTH - btnW) / 2;
    let btnY = 220;
    const btnGap = 10;

    for (let li = 0; li < levels.length; li++) {
      const level = levels[li];
      const unlocked = level.id <= this.highestUnlockedLevel;
      const stars = this.levelStars[level.id] ?? 0;

      // Stagger animation: each button delays 100ms
      const btnDelay = 0.3 + li * 0.12;
      const btnProgress = easeOut((menuElapsed - btnDelay) / 0.45);
      const btnOffsetY = (1 - btnProgress) * 50;

      this.ctx.save();
      this.ctx.globalAlpha = btnProgress;
      const animatedBtnY = btnY + btnOffsetY;

      // Glassmorphism button background
      if (unlocked) {
        // Inner glow
        const glowGrad = this.ctx.createRadialGradient(
          btnX + btnW / 2, btnY + btnH / 2, 10,
          btnX + btnW / 2, btnY + btnH / 2, btnW * 0.7
        );
        if (level.id === 1) {
          glowGrad.addColorStop(0, 'rgba(100,200,255,0.25)');
          glowGrad.addColorStop(1, 'rgba(100,200,255,0.08)');
        } else if (level.id === 2) {
          glowGrad.addColorStop(0, 'rgba(255,150,100,0.25)');
          glowGrad.addColorStop(1, 'rgba(255,100,150,0.08)');
        } else {
          glowGrad.addColorStop(0, 'rgba(200,100,255,0.25)');
          glowGrad.addColorStop(1, 'rgba(150,50,200,0.08)');
        }
        this.ctx.fillStyle = glowGrad;
      } else {
        this.ctx.fillStyle = 'rgba(80,80,80,0.2)';
      }
      this.ctx.beginPath();
      this.ctx.roundRect(btnX, animatedBtnY, btnW, btnH, 18);
      this.ctx.fill();

      // Glass overlay
      if (unlocked) {
        const glassGrad = this.ctx.createLinearGradient(btnX, animatedBtnY, btnX, animatedBtnY + btnH);
        glassGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
        glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        glassGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
        this.ctx.fillStyle = glassGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, animatedBtnY, btnW, btnH, 18);
        this.ctx.fill();
      }

      // Border
      this.ctx.strokeStyle = unlocked
        ? 'rgba(255,255,255,0.25)'
        : 'rgba(100,100,100,0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(btnX, animatedBtnY, btnW, btnH, 18);
      this.ctx.stroke();

      // Level name
      this.ctx.fillStyle = unlocked ? COLORS.textWhite : 'rgba(255, 255, 255, 0.35)';
      this.ctx.font = 'bold 22px PingFang SC';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(level.name, btnX + 20, animatedBtnY + btnH / 2 - 7);

      // Difficulty info
      this.ctx.font = '12px PingFang SC';
      this.ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
      const info = `卡槽${level.slotCount}格 · ${level.layers}层`;
      this.ctx.fillText(info, btnX + 20, animatedBtnY + btnH / 2 + 11);

      // Stars or lock
      if (unlocked && stars > 0) {
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(starStr, btnX + btnW - 15, animatedBtnY + btnH / 2);
      } else if (!unlocked) {
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('🔒', btnX + btnW - 15, animatedBtnY + btnH / 2);
      }

      this.ctx.restore();
      this.levelButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, levelId: level.id });
      btnY += btnH + btnGap;
    }

    // Custom difficulty button
    const customBtnY = btnY + 4;
    const customDelay = 0.3 + levels.length * 0.12 + 0.05;
    const customProgress = easeOut((menuElapsed - customDelay) / 0.45);
    const customOffsetY = (1 - customProgress) * 40;
    this.ctx.save();
    this.ctx.globalAlpha = customProgress;
    // Gradient border style
    const customGrad = this.ctx.createLinearGradient(btnX, customBtnY + customOffsetY, btnX + btnW, customBtnY + customOffsetY);
    customGrad.addColorStop(0, 'rgba(255,100,180,0.3)');
    customGrad.addColorStop(0.5, 'rgba(100,200,255,0.3)');
    customGrad.addColorStop(1, 'rgba(200,100,255,0.3)');
    this.ctx.fillStyle = customGrad;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, customBtnY + customOffsetY, btnW, btnH, 18);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,100,180,0.5)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([6, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🎨 自定义难度', btnX + 20, customBtnY + customOffsetY + btnH / 2 - 2);
    this.ctx.font = '12px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.fillText('自由配置所有参数', btnX + 20, customBtnY + customOffsetY + btnH / 2 + 16);
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('⚙️', btnX + btnW - 15, customBtnY + customOffsetY + btnH / 2);
    this.ctx.restore();
    this.levelButtons.push({ x: btnX, y: customBtnY, w: btnW, h: btnH, levelId: -1 });

    // Help button — glassmorphism with entrance animation
    const helpBtnDelay = 0.3 + levels.length * 0.12 + 0.1;
    const helpBtnProgress = easeOut((menuElapsed - helpBtnDelay) / 0.4);
    const helpBtnY = CANVAS_HEIGHT / 2 + 220 + (1 - helpBtnProgress) * 30;
    this.ctx.save();
    this.ctx.globalAlpha = helpBtnProgress;
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.beginPath();
    this.ctx.roundRect(CANVAS_WIDTH / 2 - 65, helpBtnY, 130, 42, 21);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    this.ctx.font = '16px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('📖 使用说明', CANVAS_WIDTH / 2, helpBtnY + 21);
    this.ctx.restore();

    // Settings button — glassmorphism (always visible)
    this.ctx.fillStyle = 'rgba(100,200,255,0.3)';
    this.ctx.beginPath();
    this.ctx.roundRect(CANVAS_WIDTH - 55, 15, 40, 40, 20);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⚙', CANVAS_WIDTH - 35, 35);

    // Version — fade in last
    const versionProgress = easeOut((menuElapsed - 0.8) / 0.4);
    this.ctx.globalAlpha = versionProgress;
    this.ctx.font = '11px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('v1.0.0', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    this.ctx.globalAlpha = 1;

    this.ctx.restore();
  }

  private renderGameOver(): void {
    this.ctx.save();

    // Radial gradient overlay — center bright, edges dark
    const overlayGrad = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    overlayGrad.addColorStop(0, 'rgba(30,10,40,0.5)');
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.75)');
    this.ctx.fillStyle = overlayGrad;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply GSAP overlay animation
    this.ctx.globalAlpha = this.overlay.alpha;
    this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ctx.scale(this.overlay.scale, this.overlay.scale);
    this.ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

    // Title
    this.ctx.shadowColor = 'rgba(255,100,100,0.4)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 44px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
    this.ctx.shadowBlur = 0;

    // Sad emoji
    this.ctx.font = '40px Arial';
    this.ctx.fillText('💔', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

    // Stats — with icons
    this.ctx.font = '17px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const statsY = CANVAS_HEIGHT / 2 - 20;
    this.ctx.fillText(`📋 ${this.currentConfig.name}`, CANVAS_WIDTH / 2, statsY);
    this.ctx.fillText(`✨ ${this.score} 分`, CANVAS_WIDTH / 2, statsY + 30);
    this.ctx.fillText(`🃏 消除 ${this.cardsCleared} / ${this.totalCards}`, CANVAS_WIDTH / 2, statsY + 60);
    this.ctx.fillText(`🔥 最高 ${this.maxCombo} 连击`, CANVAS_WIDTH / 2, statsY + 90);

    // Buttons
    const btnW = 180;
    const btnH = 50;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;

    // Restart button — gradient
    const restartY = CANVAS_HEIGHT / 2 + 80;
    const grad1 = this.ctx.createLinearGradient(btnX, restartY, btnX + btnW, restartY);
    grad1.addColorStop(0, 'rgba(100,200,255,0.85)');
    grad1.addColorStop(1, 'rgba(200,100,255,0.85)');
    this.ctx.fillStyle = grad1;
    this.ctx.shadowColor = 'rgba(100,200,255,0.3)';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, restartY, btnW, btnH, 25);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.fillText('重新开始', CANVAS_WIDTH / 2, restartY + btnH / 2);

    // Menu button — glass
    const menuY = CANVAS_HEIGHT / 2 + 150;
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, menuY, btnW, btnH, 25);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.fillText('返回菜单', CANVAS_WIDTH / 2, menuY + btnH / 2);

    this.ctx.restore();
  }

  private renderLevelComplete(): void {
    this.ctx.save();

    // Radial gradient overlay — golden glow at center
    const overlayGrad = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 30,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    overlayGrad.addColorStop(0, 'rgba(40,20,60,0.45)');
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    this.ctx.fillStyle = overlayGrad;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply GSAP overlay animation
    this.ctx.globalAlpha = this.overlay.alpha;
    this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ctx.scale(this.overlay.scale, this.overlay.scale);
    this.ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

    // Title with glow
    this.ctx.shadowColor = 'rgba(255,200,50,0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 44px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('恭喜过关!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 140);
    this.ctx.shadowBlur = 0;

    // Stars with staggered pop-in animation
    const stars = this.computeStars();
    const elapsed = (performance.now() - this.levelCompleteTime) / 1000;

    for (let i = 0; i < 3; i++) {
      const starDelay = 0.3 + i * 0.25;
      const starElapsed = elapsed - starDelay;

      if (starElapsed < 0) {
        // Not yet — draw empty star
        this.ctx.font = '38px Arial';
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.fillText('☆', CANVAS_WIDTH / 2 - 44 + i * 44, CANVAS_HEIGHT / 2 - 80);
        continue;
      }

      // Pop-in scale: 0→1.3→1.0 over 0.4s
      const t = Math.min(starElapsed / 0.4, 1);
      let starScale: number;
      if (t < 0.6) {
        starScale = (t / 0.6) * 1.3;
      } else {
        starScale = 1.3 - ((t - 0.6) / 0.4) * 0.3;
      }
      const alpha = Math.min(starElapsed / 0.2, 1);

      const isEarned = i < stars;
      const starX = CANVAS_WIDTH / 2 - 44 + i * 44;
      const starY = CANVAS_HEIGHT / 2 - 80;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(starX, starY);
      this.ctx.scale(starScale, starScale);

      if (isEarned) {
        this.ctx.shadowColor = 'rgba(255,200,50,0.6)';
        this.ctx.shadowBlur = 12;
        this.ctx.font = '38px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⭐', 0, 0);
        this.ctx.shadowBlur = 0;
      } else {
        this.ctx.font = '38px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fillText('☆', 0, 0);
      }

      this.ctx.restore();

      // Sparkle burst when star appears
      if (isEarned && starElapsed > 0 && starElapsed < 0.15) {
        this.spawnBurst(starX, starY, 4, 2);
      }
    }

    // Stats — with icons
    this.ctx.font = '17px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const statsY = CANVAS_HEIGHT / 2 - 25;
    this.ctx.fillText(`📋 ${this.currentConfig.name}`, CANVAS_WIDTH / 2, statsY);
    this.ctx.fillText(`✨ ${this.score} 分`, CANVAS_WIDTH / 2, statsY + 28);

    const timeMins = Math.floor(this.timePlayed / 60);
    const timeSecs = Math.floor(this.timePlayed % 60);
    this.ctx.fillText(`⏱️ ${timeMins}:${timeSecs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, statsY + 56);
    this.ctx.fillText(`🔥 最高 ${this.maxCombo} 连击`, CANVAS_WIDTH / 2, statsY + 84);

    // Button — gradient with glow
    const btnW = 200;
    const btnH = 52;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;
    const btnY = CANVAS_HEIGHT / 2 + 100;

    const grad = this.ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    grad.addColorStop(0, 'rgba(100,200,255,0.85)');
    grad.addColorStop(0.5, 'rgba(180,130,255,0.85)');
    grad.addColorStop(1, 'rgba(255,100,180,0.85)');
    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = 'rgba(180,130,255,0.4)';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnY, btnW, btnH, 26);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    const btnLabel = this.currentLevel < Level.getTotalLevels() ? '✨ 下一关' : '🏠 返回菜单';
    this.ctx.fillText(btnLabel, CANVAS_WIDTH / 2, btnY + btnH / 2);

    this.ctx.restore();
  }

  private renderPauseOverlay(): void {
    this.ctx.save();

    // Radial gradient overlay
    const overlayGrad = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 30,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    overlayGrad.addColorStop(0, 'rgba(20,30,60,0.4)');
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    this.ctx.fillStyle = overlayGrad;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title with subtle glow
    this.ctx.shadowColor = 'rgba(100,200,255,0.3)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 42px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⏸ 暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    this.ctx.shadowBlur = 0;

    const btnW = 190;
    const btnH = 50;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;

    // Continue button — gradient
    const continueY = CANVAS_HEIGHT / 2 + 20;
    const grad = this.ctx.createLinearGradient(btnX, continueY, btnX + btnW, continueY);
    grad.addColorStop(0, 'rgba(100,200,255,0.85)');
    grad.addColorStop(1, 'rgba(180,130,255,0.85)');
    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = 'rgba(100,200,255,0.3)';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, continueY, btnW, btnH, 25);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.fillText('▶ 继续游戏', CANVAS_WIDTH / 2, continueY + btnH / 2);

    // Menu button — glass
    const menuY = CANVAS_HEIGHT / 2 + 90;
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, menuY, btnW, btnH, 25);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.fillText('🏠 返回菜单', CANVAS_WIDTH / 2, menuY + btnH / 2);

    this.ctx.restore();
  }

  // --- Custom Difficulty ---

  private handleCustomAction(action: string): void {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    switch (action) {
      case 'layers-':    this.customLayers = clamp(this.customLayers - 1, 3, 12); break;
      case 'layers+':    this.customLayers = clamp(this.customLayers + 1, 3, 12); break;
      case 'cols-':      this.customBoardCols = clamp(this.customBoardCols - 1, 5, 12); break;
      case 'cols+':      this.customBoardCols = clamp(this.customBoardCols + 1, 5, 12); break;
      case 'rows-':      this.customBoardRows = clamp(this.customBoardRows - 1, 5, 14); break;
      case 'rows+':      this.customBoardRows = clamp(this.customBoardRows + 1, 5, 14); break;
      case 'cardSize-':  this.customCardSize = clamp(this.customCardSize - 4, 28, 70); break;
      case 'cardSize+':  this.customCardSize = clamp(this.customCardSize + 4, 28, 70); break;
      case 'slots-':     this.customSlotCount = clamp(this.customSlotCount - 1, 3, 8); break;
      case 'slots+':     this.customSlotCount = clamp(this.customSlotCount + 1, 3, 8); break;
      case 'time-':
        this.customTimeLimitIndex = clamp(this.customTimeLimitIndex - 1, 0, Game.TIME_OPTIONS.length - 1);
        break;
      case 'time+':
        this.customTimeLimitIndex = clamp(this.customTimeLimitIndex + 1, 0, Game.TIME_OPTIONS.length - 1);
        break;
      case 'props-':
        this.customPropIndex = clamp(this.customPropIndex - 1, 0, Game.PROP_OPTIONS.length - 1);
        break;
      case 'props+':
        this.customPropIndex = clamp(this.customPropIndex + 1, 0, Game.PROP_OPTIONS.length - 1);
        break;
      case 'start':
        this.startCustomLevel();
        break;
      case 'back':
        this.transitionToState(GameState.Menu);
        break;
    }
  }

  private startCustomLevel(): void {
    const config: LevelConfig = {
      id: 99,
      name: '自定义',
      layers: this.customLayers,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: this.customBoardCols,
      boardRows: this.customBoardRows,
      cardSize: this.customCardSize,
      cardGap: Math.max(3, Math.round(this.customCardSize * 0.1)),
      slotCount: this.customSlotCount,
      timeLimit: Game.TIME_OPTIONS[this.customTimeLimitIndex],
      propUsesMultiplier: Game.PROP_OPTIONS[this.customPropIndex],
    };
    this.transitionToState(GameState.Playing, () => {
      this.currentLevel = 99;
      this.currentConfig = config;
      this.score = 0;
      this.combo = 0;

      const boardStartY = this.getBoardStartY();
      this.board = new Board({
        layers: config.layers,
        cardTypes: config.cardTypes,
        boardCols: config.boardCols,
        boardRows: config.boardRows,
        cardSize: config.cardSize,
        cardGap: config.cardGap,
        boardStartY,
      });
      this.board.generate();
      this.totalCards = this.board.getTotalCount();

      const slotY = this.getSlotY();
      this.slot = new Slot(config.slotCount, config.cardSize, slotY);

      this.propManager.resetAll();
      this.propManager.applyUsesMultiplier(config.propUsesMultiplier);

      if (config.timeLimit !== null) {
        this.timeRemaining = config.timeLimit;
        this.timerActive = true;
      } else {
        this.timerActive = false;
        this.timeRemaining = 0;
      }

      this.maxCombo = 0;
      this.cardsCleared = 0;
      this.timePlayed = 0;
      this.comboPopups = [];
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;

      this.state = GameState.Playing;
    });
  }

  private renderCustomConfig(): void {
    this.ctx.save();
    this.customButtons = [];

    const menuElapsed = (performance.now() - this.menuEnterTime) / 1000;
    const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(t, 1), 3);
    const progress = easeOut(menuElapsed / 0.4);
    this.ctx.globalAlpha = progress;

    // Title
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 32px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎨 自定义难度', CANVAS_WIDTH / 2, 80);

    this.ctx.font = '14px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.fillText('调整参数后点击开始', CANVAS_WIDTH / 2, 112);

    // Parameter rows
    const rows = [
      { label: '层数',      value: `${this.customLayers}`,              action: 'layers',   suffix: '' },
      { label: '棋盘列数',  value: `${this.customBoardCols}`,           action: 'cols',     suffix: '' },
      { label: '棋盘行数',  value: `${this.customBoardRows}`,           action: 'rows',     suffix: '' },
      { label: '卡牌大小',  value: `${this.customCardSize}px`,          action: 'cardSize', suffix: '' },
      { label: '卡槽数量',  value: `${this.customSlotCount}`,           action: 'slots',    suffix: '' },
      { label: '时间限制',  value: Game.TIME_LABELS[this.customTimeLimitIndex], action: 'time', suffix: '' },
      { label: '道具倍率',  value: Game.PROP_LABELS[this.customPropIndex],     action: 'props',  suffix: '' },
    ];

    const rowH = 52;
    const startY = 145;
    const labelX = 40;
    const valueX = CANVAS_WIDTH / 2;
    const btnSize = 36;
    const minusX = CANVAS_WIDTH / 2 - 70;
    const plusX = CANVAS_WIDTH / 2 + 50;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y = startY + i * rowH;

      // Row background
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
      this.ctx.beginPath();
      this.ctx.roundRect(20, y, CANVAS_WIDTH - 40, rowH - 4, 10);
      this.ctx.fill();

      // Label
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.font = '16px PingFang SC';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(row.label, labelX, y + rowH / 2 - 2);

      // Minus button
      const mX = minusX;
      const mY = y + (rowH - btnSize) / 2 - 2;
      this.ctx.fillStyle = 'rgba(100,200,255,0.25)';
      this.ctx.beginPath();
      this.ctx.roundRect(mX, mY, btnSize, btnSize, 8);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.fillStyle = COLORS.textWhite;
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('−', mX + btnSize / 2, mY + btnSize / 2);
      this.customButtons.push({ x: mX, y: mY, w: btnSize, h: btnSize, action: `${row.action}-` });

      // Value
      this.ctx.fillStyle = COLORS.textWhite;
      this.ctx.font = 'bold 18px PingFang SC';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(row.value, valueX, y + rowH / 2 - 2);

      // Plus button
      const pX = plusX;
      this.ctx.fillStyle = 'rgba(100,200,255,0.25)';
      this.ctx.beginPath();
      this.ctx.roundRect(pX, mY, btnSize, btnSize, 8);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(100,200,255,0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.fillStyle = COLORS.textWhite;
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('+', pX + btnSize / 2, mY + btnSize / 2);
      this.customButtons.push({ x: pX, y: mY, w: btnSize, h: btnSize, action: `${row.action}+` });
    }

    // Start button
    const startBtnY = startY + rows.length * rowH + 20;
    const btnW = 220;
    const btnH = 54;
    const btnX = (CANVAS_WIDTH - btnW) / 2;
    const grad = this.ctx.createLinearGradient(btnX, startBtnY, btnX + btnW, startBtnY);
    grad.addColorStop(0, 'rgba(100,200,255,0.85)');
    grad.addColorStop(0.5, 'rgba(180,130,255,0.85)');
    grad.addColorStop(1, 'rgba(255,100,180,0.85)');
    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = 'rgba(180,130,255,0.4)';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, startBtnY, btnW, btnH, 27);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 22px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎮 开始游戏', CANVAS_WIDTH / 2, startBtnY + btnH / 2);
    this.customButtons.push({ x: btnX, y: startBtnY, w: btnW, h: btnH, action: 'start' });

    // Back button
    const backBtnY = startBtnY + btnH + 14;
    this.ctx.fillStyle = 'rgba(255,255,255,0.08)';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, backBtnY, btnW, 44, 22);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(100,200,255,0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = '16px PingFang SC';
    this.ctx.fillText('← 返回菜单', CANVAS_WIDTH / 2, backBtnY + 22);
    this.customButtons.push({ x: btnX, y: backBtnY, w: btnW, h: 44, action: 'back' });

    // Preview info
    const previewY = backBtnY + 60;
    const totalCards = this.customBoardCols * this.customBoardRows * this.customLayers;
    const roundedTotal = Math.floor(totalCards / 3) * 3;
    this.ctx.font = '13px PingFang SC';
    this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
    this.ctx.fillText(`预计卡牌: ~${roundedTotal}张`, CANVAS_WIDTH / 2, previewY);

    this.ctx.restore();
  }

  // --- Persistence ---

  private saveProgress(): void {
    try {
      const data: SaveData = {
        highestLevel: this.highestUnlockedLevel,
        stars: this.levelStars,
        highScores: this.levelHighScores,
      };
      localStorage.setItem('love-match-progress', JSON.stringify(data));
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadProgress(): void {
    try {
      const raw = localStorage.getItem('love-match-progress');
      if (raw) {
        const data = JSON.parse(raw) as SaveData;
        this.highestUnlockedLevel = Math.max(data.highestLevel ?? 1, Level.getTotalLevels());
        this.levelStars = data.stars ?? {};
        this.levelHighScores = data.highScores ?? {};
      } else {
        this.highestUnlockedLevel = Level.getTotalLevels();
      }
    } catch {
      this.highestUnlockedLevel = Level.getTotalLevels();
    }
  }

  getState(): GameState {
    return this.state;
  }

  setState(state: GameState): void {
    this.state = state;
  }

  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClickBound);
    this.canvas.removeEventListener('touchstart', this.handleTouchBound);
    if (this.initAudioBound) {
      this.canvas.removeEventListener('click', this.initAudioBound);
      this.canvas.removeEventListener('touchstart', this.initAudioBound);
      this.initAudioBound = null;
    }
    this.audioManager.stopBGM();
    gsap.globalTimeline.clear();
    if (this.settingsPanelElement?.parentNode) {
      this.settingsPanelElement.parentNode.removeChild(this.settingsPanelElement);
      this.settingsPanelElement = null;
    }
    if (this.helpPanelElement?.parentNode) {
      this.helpPanelElement.parentNode.removeChild(this.helpPanelElement);
      this.helpPanelElement = null;
    }
  }
}
