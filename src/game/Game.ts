import { Board } from './Board';
import { Slot } from './Slot';
import { Level } from './Level';
import { GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import { EasterEggManager } from '../easter-eggs/EasterEggManager';
import { PropManager } from '../props/PropManager';
import { AudioManager } from '../audio/AudioManager';
import { ThemeManager } from '../themes/ThemeManager';
import { SettingsPanel } from '../ui/SettingsPanel';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: Board;
  private slot: Slot;
  private state: GameState = GameState.Menu;
  private currentLevel: number = 1;
  private score: number = 0;
  private combo: number = 0;
  private lastTime: number = 0;
  private easterEggManager: EasterEggManager;
  private propManager: PropManager;
  private audioManager: AudioManager;
  private themeManager: ThemeManager;
  private settingsPanel: SettingsPanel;
  private settingsPanelElement: HTMLElement | null = null;
  private handleClickBound: (e: MouseEvent) => void;
  private handleTouchBound: (e: TouchEvent) => void;
  private hintTimer: number = 0;
  private isHintActive: boolean = false;
  // Snow particles
  private snowflakes: Array<{x: number, y: number, size: number, speed: number, opacity: number}> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.board = new Board(2, []);
    this.slot = new Slot();
    this.easterEggManager = new EasterEggManager();
    this.propManager = new PropManager();
    this.audioManager = AudioManager.getInstance();
    // Initialize audio on first user interaction
    this.initAudioOnInteraction();
    // Initialize ThemeManager singleton for SettingsPanel to use
    this.themeManager = ThemeManager.getInstance();
    this.themeManager.addListener(this.onThemeChanged.bind(this));
    this.settingsPanel = new SettingsPanel();
    this.settingsPanelElement = this.settingsPanel.getElement();
    document.body.appendChild(this.settingsPanelElement);

    this.handleClickBound = this.handleClick.bind(this);
    this.handleTouchBound = this.handleTouch.bind(this);

    this.setupCanvas();
    this.setupEventListeners();
    this.initSnowflakes();
  }

  private initSnowflakes(): void {
    // Create 50 snowflakes
    for (let i = 0; i < 50; i++) {
      this.snowflakes.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
  }

  private updateSnowflakes(deltaTime: number): void {
    this.snowflakes.forEach(flake => {
      flake.y += flake.speed * deltaTime * 60;
      flake.x += Math.sin(flake.y * 0.01) * 0.5;

      // Reset snowflake when it goes off screen
      if (flake.y > CANVAS_HEIGHT) {
        flake.y = -10;
        flake.x = Math.random() * CANVAS_WIDTH;
      }
    });
  }

  private renderSnowflakes(): void {
    this.ctx.save();
    this.snowflakes.forEach(flake => {
      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  private onThemeChanged(): void {
    // Theme changed, force re-render
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
      // Remove listeners after first interaction
      this.canvas.removeEventListener('click', initAudio);
      this.canvas.removeEventListener('touchstart', initAudio);
    };
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
    // Check if settings button clicked (any state)
    if (x >= CANVAS_WIDTH - 60 && x <= CANVAS_WIDTH - 20 && y >= 20 && y <= 60) {
      this.settingsPanel.toggle();
      return;
    }

    // Menu state: start level 1 on any click
    if (this.state === GameState.Menu) {
      this.startLevel(1);
      return;
    }

    // Game Over: click to restart current level
    if (this.state === GameState.GameOver) {
      this.startLevel(this.currentLevel);
      return;
    }

    // Level Complete: click to advance to next level
    if (this.state === GameState.LevelComplete) {
      const nextLevel = this.currentLevel + 1;
      if (nextLevel <= Level.getTotalLevels()) {
        this.startLevel(nextLevel);
      } else {
        // All levels beaten, return to menu
        this.state = GameState.Menu;
      }
      return;
    }

    if (this.state !== GameState.Playing && this.state !== GameState.Paused) return;

    // Check control buttons
    const buttonSize = 40;
    const buttonY = 20;
    const buttonGap = 10;

    // Pause button
    const pauseX = 20;
    if (x >= pauseX && x <= pauseX + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      this.togglePause();
      return;
    }

    // Back to menu button
    const menuX = pauseX + buttonSize + buttonGap;
    if (x >= menuX && x <= menuX + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      this.state = GameState.Menu;
      return;
    }

    // Check props bar
    const props = this.propManager.getProps();
    const barY = 130;
    const propSize = 50;
    const gap = 10;
    const totalWidth = props.length * (propSize + gap) - gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    for (let i = 0; i < props.length; i++) {
      const propX = startX + i * (propSize + gap);
      if (x >= propX && x <= propX + propSize && y >= barY && y <= barY + propSize) {
        this.useProp(props[i].getId());
        return;
      }
    }

    const card = this.board.getCardAtPosition(x, y);
    if (!card) return;

    // Play click animation
    card.playClickAnimation();

    // Add to slot
    const added = this.slot.addCard(card);
    if (!added) return; // slot animation in progress, ignore

    // Remove from board
    this.board.removeCard(card);

    // Play click sound
    this.audioManager.playSound('click');

    // Check for matches FIRST (may free up slot space)
    this.checkMatches();

    // Only game over if slot is still full after match check
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
      // Remove matching cards
      this.slot.removeCards(lastCard.type);

      // Combo bonus
      this.combo++;
      const comboMultiplier = Math.min(this.combo, 5);
      const baseScore = 100;
      const comboBonus = baseScore * comboMultiplier;
      this.score += comboBonus;

      // Trigger easter egg
      this.easterEggManager.trigger(lastCard.type);

      // Play match sound
      this.audioManager.playSound('match');

      // Check level complete
      if (this.board.getCards().length === 0) {
        this.levelComplete();
      }
    } else {
      // Reset combo if no match
      this.combo = 0;
    }
  }

  startLevel(levelId: number): void {
    this.currentLevel = levelId;
    this.score = 0; // Reset score for new level
    this.combo = 0; // Reset combo
    const config = Level.getLevel(levelId);
    this.board = new Board(config.layers, config.cardTypes);
    this.board.generate();
    this.slot = new Slot();
    this.state = GameState.Playing;
  }

  private levelComplete(): void {
    this.state = GameState.LevelComplete;
    this.audioManager.playSound('level-complete');
  }

  private gameOver(): void {
    this.state = GameState.GameOver;
    this.audioManager.playSound('game-over');
  }

  private togglePause(): void {
    if (this.state === GameState.Playing) {
      this.state = GameState.Paused;
    } else if (this.state === GameState.Paused) {
      this.state = GameState.Playing;
    }
  }

  private useProp(propId: string): void {
    const cards = this.slot.getCards();
    const success = this.propManager.useProp(propId, this.board, this.slot, cards);
    if (success) {
      this.audioManager.playSound('click');
      if (propId === 'hint') {
        this.isHintActive = true;
        this.hintTimer = 3; // Show hint for 3 seconds
      }
    }
  }

  update(timestamp: number): void {
    // Skip first frame to avoid huge deltaTime
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return;
    }

    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Update snowflakes always
    this.updateSnowflakes(deltaTime);

    if (this.state === GameState.Playing) {
      this.board.update(deltaTime);
      this.easterEggManager.update(deltaTime);
      this.propManager.update(deltaTime);

      // Update hint timer
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

    // Background - use theme colors
    const theme = this.themeManager.getCurrentTheme();
    const gradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, theme.colors.primary);
    gradient.addColorStop(1, theme.colors.secondary);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render snowflakes
    this.renderSnowflakes();

    // Game elements
    if (this.state === GameState.Playing || this.state === GameState.Paused) {
      this.board.render(this.ctx);
      this.slot.render(this.ctx);
      this.renderHUD();
      this.renderPropsBar();
      this.renderControlButtons();
      this.easterEggManager.render(this.ctx);
    }

    // Menu
    if (this.state === GameState.Menu) {
      this.renderMenu();
    }

    // Game Over
    if (this.state === GameState.GameOver) {
      this.board.render(this.ctx);
      this.slot.render(this.ctx);
      this.renderGameOver();
    }

    // Level Complete
    if (this.state === GameState.LevelComplete) {
      this.renderLevelComplete();
    }
  }

  private renderHUD(): void {
    this.ctx.save();
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 24px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`第 ${this.currentLevel} 关`, CANVAS_WIDTH / 2, 50);

    this.ctx.font = '18px PingFang SC';
    this.ctx.fillText(`分数: ${this.score}`, CANVAS_WIDTH / 2, 80);

    // Show combo
    if (this.combo > 1) {
      this.ctx.font = 'bold 20px PingFang SC';
      this.ctx.fillStyle = COLORS.star;
      this.ctx.fillText(`${this.combo}连击!`, CANVAS_WIDTH / 2, 110);
    }

    // Show hint indicator
    if (this.isHintActive) {
      this.ctx.font = '16px PingFang SC';
      this.ctx.fillStyle = COLORS.star;
      this.ctx.fillText('💡 提示中...', CANVAS_WIDTH / 2, 140);
    }

    this.ctx.restore();
  }

  private renderPropsBar(): void {
    const props = this.propManager.getProps();
    const barY = 130;
    const propSize = 50;
    const gap = 10;
    const totalWidth = props.length * (propSize + gap) - gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    this.ctx.save();

    // Bar background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(startX - 10, barY - 10, totalWidth + 20, propSize + 20, 12);
    this.ctx.fill();

    props.forEach((prop, index) => {
      const x = startX + index * (propSize + gap);
      const isAvailable = prop.isAvailable();

      // Prop button background
      this.ctx.fillStyle = isAvailable ? COLORS.accent : 'rgba(200, 200, 200, 0.5)';
      this.ctx.beginPath();
      this.ctx.roundRect(x, barY, propSize, propSize, 8);
      this.ctx.fill();

      // Cooldown overlay
      if (prop.getCooldownPercent() > 0) {
        const cooldownHeight = propSize * prop.getCooldownPercent();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, barY + propSize - cooldownHeight, propSize, cooldownHeight);
      }

      // Prop icon
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = isAvailable ? COLORS.textWhite : 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText(prop.getIcon(), x + propSize / 2, barY + propSize / 2);

      // Uses count
      this.ctx.font = '12px PingFang SC';
      this.ctx.fillStyle = COLORS.textWhite;
      this.ctx.fillText(`${prop.getUsesLeft()}`, x + propSize / 2, barY + propSize + 8);
    });

    this.ctx.restore();
  }

  private renderControlButtons(): void {
    const buttonSize = 40;
    const buttonY = 20;
    const buttonGap = 10;

    this.ctx.save();

    // Pause button
    const pauseX = 20;
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(pauseX, buttonY, buttonSize, buttonSize, 20);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.state === GameState.Paused ? '▶' : '⏸', pauseX + buttonSize / 2, buttonY + buttonSize / 2);

    // Back to menu button
    const menuX = pauseX + buttonSize + buttonGap;
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(menuX, buttonY, buttonSize, buttonSize, 20);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('🏠', menuX + buttonSize / 2, buttonY + buttonSize / 2);

    this.ctx.restore();
  }

  private renderMenu(): void {
    this.ctx.save();
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 48px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('爱心消消乐', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    this.ctx.font = '24px PingFang SC';
    this.ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Start button
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 + 40, 160, 50, 25);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 20px PingFang SC';
    this.ctx.fillText('开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

    // Settings button
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(CANVAS_WIDTH - 60, 20, 40, 40, 20);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⚙', CANVAS_WIDTH - 40, 40);

    this.ctx.restore();
  }

  private renderGameOver(): void {
    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Game Over text
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 48px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    this.ctx.font = '20px PingFang SC';
    this.ctx.fillText(`最终分数: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 60);
    this.ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 110);

    this.ctx.restore();
  }

  private renderLevelComplete(): void {
    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Level Complete text
    this.ctx.fillStyle = COLORS.textWhite;
    this.ctx.font = 'bold 48px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('恭喜过关!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    this.ctx.font = '20px PingFang SC';
    this.ctx.fillText(`分数: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 60);

    if (this.currentLevel < Level.getTotalLevels()) {
      this.ctx.fillText('点击进入下一关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 110);
    } else {
      this.ctx.fillText('恭喜通关! 点击返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 110);
    }

    this.ctx.restore();
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
    if (this.settingsPanelElement?.parentNode) {
      this.settingsPanelElement.parentNode.removeChild(this.settingsPanelElement);
      this.settingsPanelElement = null;
    }
  }
}
