import { Board } from './Board';
import { Slot } from './Slot';
import { Level } from './Level';
import { GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: Board;
  private slot: Slot;
  private state: GameState = GameState.Menu;
  private currentLevel: number = 1;
  private score: number = 0;
  private lastTime: number = 0;
  private handleClickBound: (e: MouseEvent) => void;
  private handleTouchBound: (e: TouchEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.board = new Board(2, []);
    this.slot = new Slot();

    this.handleClickBound = this.handleClick.bind(this);
    this.handleTouchBound = this.handleTouch.bind(this);

    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClickBound);
    this.canvas.addEventListener('touchstart', this.handleTouchBound);
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
    if (this.state !== GameState.Playing) return;

    const card = this.board.getCardAtPosition(x, y);
    if (!card) return;

    // Add to slot
    const added = this.slot.addCard(card);
    if (!added) {
      this.gameOver();
      return;
    }

    // Check if slot is full BEFORE checking matches
    if (this.slot.isFull()) {
      this.gameOver();
      return;
    }

    // Remove from board
    this.board.removeCard(card);

    // Check for matches
    this.checkMatches();
  }

  private checkMatches(): void {
    const cards = this.slot.getCards();
    if (cards.length === 0) return;
    const lastCard = cards[cards.length - 1];
    const matching = cards.filter(c => c.type === lastCard.type);

    if (matching.length >= 3) {
      // Remove matching cards
      this.slot.removeCards(lastCard.type);
      this.score += 100;

      // Check level complete
      if (this.board.getCards().length === 0) {
        this.levelComplete();
      }
    }
  }

  startLevel(levelId: number): void {
    this.currentLevel = levelId;
    const config = Level.getLevel(levelId);
    this.board = new Board(config.layers, config.cardTypes);
    this.board.generate();
    this.slot = new Slot();
    this.state = GameState.Playing;
  }

  private levelComplete(): void {
    this.state = GameState.LevelComplete;
    // TODO: Show level complete UI
  }

  private gameOver(): void {
    this.state = GameState.GameOver;
    // TODO: Show game over UI
  }

  update(timestamp: number): void {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (this.state === GameState.Playing) {
      this.board.update(deltaTime);
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    const gradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, COLORS.bgGradientStart);
    gradient.addColorStop(1, COLORS.bgGradientEnd);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Game elements
    if (this.state === GameState.Playing || this.state === GameState.Paused) {
      this.board.render(this.ctx);
      this.slot.render(this.ctx);
      this.renderHUD();
    }

    // Menu
    if (this.state === GameState.Menu) {
      this.renderMenu();
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
  }
}
