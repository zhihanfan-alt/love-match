# Love Match - Phase 1: Core Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core three-match card game with basic UI and animations in a mobile-friendly H5 game.

**Architecture:** Canvas-based rendering with TypeScript classes for Game, Board, Card, and Slot management. State machine pattern for game flow. Event-driven architecture for user interactions.

**Tech Stack:** HTML5 Canvas, TypeScript, Vite, CSS3

---

## File Structure

```
love-match/
├── index.html                    # Entry HTML with canvas
├── package.json                  # Project config
├── tsconfig.json                 # TypeScript config
├── vite.config.ts               # Vite config
├── src/
│   ├── main.ts                  # App entry point
│   ├── types.ts                 # Type definitions
│   ├── constants.ts             # Game constants
│   ├── game/
│   │   ├── Game.ts             # Main game controller
│   │   ├── Board.ts            # Board state management
│   │   ├── Card.ts             # Card entity
│   │   ├── Slot.ts             # Slot management
│   │   └── Level.ts            # Level configurations
│   ├── renderer/
│   │   ├── CanvasRenderer.ts   # Canvas drawing
│   │   └── AnimationManager.ts # Animation system
│   ├── ui/
│   │   ├── HUD.ts              # Score, level display
│   │   └── GameOver.ts         # Game over screen
│   └── utils/
│       ├── math.ts             # Math helpers
│       └── storage.ts          # Local storage
└── styles/
    └── main.css                # Styles
```

---

## Implementation Tasks

### Task 1: Project Setup

- [ ] **1.1 Initialize Vite + TypeScript project**

```bash
cd /c/Users/fsycbi001/love-match
npm create vite@latest . -- --template vanilla-ts
npm install
```

Expected: Project initialized with package.json, tsconfig.json, vite.config.ts

- [ ] **1.2 Configure project for mobile**

Update `index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Love Match - 爱心消消乐</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <div id="app">
    <canvas id="gameCanvas"></canvas>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **1.3 Create base CSS**

`styles/main.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #FFB7C5 0%, #DDA0DD 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

#app {
  width: 100%;
  max-width: 430px;
  height: 100vh;
  position: relative;
}

#gameCanvas {
  width: 100%;
  height: 100%;
  display: block;
}
```

- [ ] **1.4 Define TypeScript types**

`src/types.ts`:
```typescript
export interface Position {
  x: number;
  y: number;
}

export interface CardData {
  id: string;
  type: CardType;
  position: Position;
  layer: number;
  isRevealed: boolean;
  isRemoved: boolean;
}

export enum CardType {
  Heart = 'heart',
  Kiss = 'kiss',
  Rose = 'rose',
  Begonia = 'begonia',
  Star = 'star',
  Moon = 'moon',
  Gift = 'gift',
  Gem = 'gem'
}

export enum GameState {
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameover',
  LevelComplete = 'levelcomplete'
}

export interface SlotItem {
  card: CardData;
  position: Position;
}

export interface LevelConfig {
  id: number;
  layers: number;
  cardTypes: CardType[];
  cardsPerType: number;
  name: string;
}
```

- [ ] **1.5 Define game constants**

`src/constants.ts`:
```typescript
import { CardType } from './types';

export const CANVAS_WIDTH = 430;
export const CANVAS_HEIGHT = 932;

export const CARD_SIZE = 60;
export const CARD_GAP = 8;
export const CARD_RADIUS = 12;

export const SLOT_COUNT = 7;
export const SLOT_HEIGHT = 80;
export const SLOT_CARD_SIZE = 50;

export const BOARD_COLS = 7;
export const BOARD_ROWS = 8;
export const BOARD_START_Y = 200;

export const COLORS = {
  primary: '#FFB7C5',
  secondary: '#DDA0DD',
  accent: '#FF69B4',
  begonia: '#FF4D6D',
  gold: '#FFD700',
  white: '#FFFFFF',
  text: '#333333',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(0,0,0,0.2)',
  slotBg: 'rgba(255,255,255,0.3)',
};

export const CARD_TYPES: CardType[] = [
  CardType.Heart,
  CardType.Kiss,
  CardType.Rose,
  CardType.Begonia,
  CardType.Star,
  CardType.Moon,
  CardType.Gift,
  CardType.Gem,
];

export const CARD_EMOJIS: Record<CardType, string> = {
  [CardType.Heart]: '💕',
  [CardType.Kiss]: '😘',
  [CardType.Rose]: '🌹',
  [CardType.Begonia]: '🌸',
  [CardType.Star]: '⭐',
  [CardType.Moon]: '🌙',
  [CardType.Gift]: '🎁',
  [CardType.Gem]: '💎',
};
```

---

### Task 2: Card Entity

- [ ] **2.1 Create Card class**

`src/game/Card.ts`:
```typescript
import { CardData, CardType, Position } from '../types';
import { CARD_SIZE, CARD_RADIUS, COLORS, CARD_EMOJIS } from '../constants';

export class Card implements CardData {
  id: string;
  type: CardType;
  position: Position;
  layer: number;
  isRevealed: boolean;
  isRemoved: boolean;

  private targetPosition: Position;
  private animationProgress: number = 0;
  private isAnimating: boolean = false;
  private scale: number = 1;
  private opacity: number = 1;

  constructor(id: string, type: CardType, position: Position, layer: number) {
    this.id = id;
    this.type = type;
    this.position = { ...position };
    this.targetPosition = { ...position };
    this.layer = layer;
    this.isRevealed = true;
    this.isRemoved = false;
  }

  update(deltaTime: number): void {
    if (!this.isAnimating) return;

    this.animationProgress += deltaTime * 3;
    if (this.animationProgress >= 1) {
      this.animationProgress = 1;
      this.isAnimating = false;
      this.position = { ...this.targetPosition };
    }

    const t = this.easeOutCubic(this.animationProgress);
    this.position.x = this.lerp(this.position.x, this.targetPosition.x, t);
    this.position.y = this.lerp(this.position.y, this.targetPosition.y, t);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isRemoved) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x + CARD_SIZE / 2, this.position.y + CARD_SIZE / 2);
    ctx.scale(this.scale, this.scale);

    // Shadow
    ctx.shadowColor = COLORS.cardShadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Card background
    this.drawRoundRect(ctx, -CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, CARD_RADIUS);
    ctx.fillStyle = COLORS.cardBg;
    ctx.fill();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CARD_EMOJIS[this.type], 0, 0);

    ctx.restore();
  }

  private drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  moveTo(target: Position): void {
    this.targetPosition = { ...target };
    this.animationProgress = 0;
    this.isAnimating = true;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.position.x &&
      x <= this.position.x + CARD_SIZE &&
      y >= this.position.y &&
      y <= this.position.y + CARD_SIZE
    );
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
```

---

### Task 3: Slot Management

- [ ] **3.1 Create Slot class**

`src/game/Slot.ts`:
```typescript
import { Card } from './Card';
import { Position, CardType } from '../types';
import { SLOT_COUNT, SLOT_CARD_SIZE, SLOT_HEIGHT, CANVAS_WIDTH, COLORS } from '../constants';

export class Slot {
  private cards: Card[] = [];
  private positions: Position[] = [];

  constructor() {
    this.calculatePositions();
  }

  private calculatePositions(): void {
    const totalWidth = SLOT_COUNT * (SLOT_CARD_SIZE + 8) - 8;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const y = 850;

    for (let i = 0; i < SLOT_COUNT; i++) {
      this.positions.push({
        x: startX + i * (SLOT_CARD_SIZE + 8),
        y: y,
      });
    }
  }

  addCard(card: Card): boolean {
    if (this.cards.length >= SLOT_COUNT) {
      return false;
    }

    this.cards.push(card);
    const targetPos = this.positions[this.cards.length - 1];
    card.moveTo(targetPos);

    return true;
  }

  removeCards(type: CardType): Card[] {
    const matching = this.cards.filter(c => c.type === type);
    if (matching.length >= 3) {
      this.cards = this.cards.filter(c => c.type !== type);
      this.repositionCards();
      return matching;
    }
    return [];
  }

  private repositionCards(): void {
    this.cards.forEach((card, index) => {
      card.moveTo(this.positions[index]);
    });
  }

  isFull(): boolean {
    return this.cards.length >= SLOT_COUNT;
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  getCardCount(): number {
    return this.cards.length;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Slot background
    const totalWidth = SLOT_COUNT * (SLOT_CARD_SIZE + 8) - 8;
    const startX = (CANVAS_WIDTH - totalWidth) / 2 - 12;
    const y = 838;

    ctx.save();
    ctx.fillStyle = COLORS.slotBg;
    ctx.beginPath();
    ctx.roundRect(startX, y, totalWidth + 24, SLOT_HEIGHT + 8, 16);
    ctx.fill();

    // Slot borders
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Empty slot indicators
    for (let i = 0; i < SLOT_COUNT; i++) {
      const pos = this.positions[i];
      ctx.strokeStyle = 'rgba(255,105,180,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, SLOT_CARD_SIZE, SLOT_CARD_SIZE, 8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
```

---

### Task 4: Board Management

- [ ] **4.1 Create Board class**

`src/game/Board.ts`:
```typescript
import { Card } from './Card';
import { CardType, Position } from '../types';
import { BOARD_COLS, BOARD_ROWS, CARD_SIZE, CARD_GAP, BOARD_START_Y, CANVAS_WIDTH, CARD_TYPES } from '../constants';

export class Board {
  private cards: Card[] = [];
  private layers: number;
  private cardTypes: CardType[];

  constructor(layers: number, cardTypes: CardType[]) {
    this.layers = layers;
    this.cardTypes = cardTypes;
  }

  generate(): void {
    this.cards = [];
    let cardId = 0;

    for (let layer = 0; layer < this.layers; layer++) {
      const cols = BOARD_COLS - layer;
      const rows = BOARD_ROWS - layer;
      const offsetX = (layer * (CARD_SIZE + CARD_GAP)) / 2;
      const offsetY = (layer * (CARD_SIZE + CARD_GAP)) / 2;

      // Generate pairs for this layer
      const totalCards = cols * rows;
      const pairsNeeded = Math.floor(totalCards / 3) * 3;
      const typesForLayer = this.selectTypesForLayer(pairsNeeded);

      let cardIndex = 0;
      for (let row = 0; row < rows && cardIndex < pairsNeeded; row++) {
        for (let col = 0; col < cols && cardIndex < pairsNeeded; col++) {
          const x = offsetX + col * (CARD_SIZE + CARD_GAP) + (CANVAS_WIDTH - cols * (CARD_SIZE + CARD_GAP)) / 2;
          const y = BOARD_START_Y + offsetY + row * (CARD_SIZE + CARD_GAP);

          const card = new Card(
            `card-${cardId++}`,
            typesForLayer[cardIndex],
            { x, y },
            layer
          );

          this.cards.push(card);
          cardIndex++;
        }
      }
    }
  }

  private selectTypesForLayer(count: number): CardType[] {
    const types: CardType[] = [];
    const availableTypes = [...this.cardTypes];

    while (types.length < count) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      types.push(type, type, type); // Always add 3 of same type
    }

    // Shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    return types.slice(0, count);
  }

  getCardAtPosition(x: number, y: number): Card | null {
    // Check from top layer to bottom
    const sortedCards = [...this.cards].sort((a, b) => b.layer - a.layer);

    for (const card of sortedCards) {
      if (!card.isRemoved && card.containsPoint(x, y)) {
        // Check if card is accessible (not covered by others)
        if (this.isCardAccessible(card)) {
          return card;
        }
      }
    }

    return null;
  }

  private isCardAccessible(card: Card): boolean {
    const higherCards = this.cards.filter(
      c => !c.isRemoved && c.layer > card.layer
    );

    for (const higher of higherCards) {
      if (this.cardsOverlap(card, higher)) {
        return false;
      }
    }

    return true;
  }

  private cardsOverlap(a: Card, b: Card): boolean {
    return !(
      a.position.x + CARD_SIZE < b.position.x ||
      b.position.x + CARD_SIZE < a.position.x ||
      a.position.y + CARD_SIZE < b.position.y ||
      b.position.y + CARD_SIZE < a.position.y
    );
  }

  removeCard(card: Card): void {
    card.isRemoved = true;
  }

  getCards(): Card[] {
    return this.cards.filter(c => !c.isRemoved);
  }

  update(deltaTime: number): void {
    this.cards.forEach(card => card.update(deltaTime));
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render from bottom layer to top
    const sortedCards = [...this.cards].sort((a, b) => a.layer - b.layer);
    sortedCards.forEach(card => card.render(ctx));
  }
}
```

---

### Task 5: Level Configuration

- [ ] **5.1 Create Level class**

`src/game/Level.ts`:
```typescript
import { LevelConfig, CardType } from '../types';
import { CARD_TYPES } from '../constants';

export class Level {
  private static levels: LevelConfig[] = [
    {
      id: 1,
      layers: 2,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Star],
      cardsPerType: 3,
      name: '初遇',
    },
    {
      id: 2,
      layers: 3,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star],
      cardsPerType: 3,
      name: '心动',
    },
    {
      id: 3,
      layers: 3,
      cardTypes: CARD_TYPES.slice(0, 6),
      cardsPerType: 3,
      name: '浪漫',
    },
    {
      id: 4,
      layers: 4,
      cardTypes: CARD_TYPES.slice(0, 6),
      cardsPerType: 3,
      name: '甜蜜',
    },
    {
      id: 5,
      layers: 4,
      cardTypes: CARD_TYPES,
      cardsPerType: 3,
      name: '永恒',
    },
  ];

  static getLevel(levelId: number): LevelConfig {
    return this.levels.find(l => l.id === levelId) || this.levels[0];
  }

  static getTotalLevels(): number {
    return this.levels.length;
  }

  static getLevelName(levelId: number): string {
    return this.getLevel(levelId).name;
  }
}
```

---

### Task 6: Game Controller

- [ ] **6.1 Create Game class**

`src/game/Game.ts`:
```typescript
import { Board } from './Board';
import { Slot } from './Slot';
import { Level } from './Level';
import { GameState, CardType } from '../types';
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.board = new Board(2, []);
    this.slot = new Slot();

    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    this.handleInteraction(x, y);
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
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

    // Remove from board
    this.board.removeCard(card);

    // Check for matches
    this.checkMatches();
  }

  private checkMatches(): void {
    const cards = this.slot.getCards();
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

    // Check if slot is full
    if (this.slot.isFull()) {
      this.gameOver();
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
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(1, COLORS.secondary);
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
    this.ctx.fillStyle = COLORS.white;
    this.ctx.font = 'bold 24px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`第 ${this.currentLevel} 关`, CANVAS_WIDTH / 2, 50);

    this.ctx.font = '18px PingFang SC';
    this.ctx.fillText(`分数: ${this.score}`, CANVAS_WIDTH / 2, 80);
    this.ctx.restore();
  }

  private renderMenu(): void {
    this.ctx.save();
    this.ctx.fillStyle = COLORS.white;
    this.ctx.font = 'bold 48px PingFang SC';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('💕 爱心消消乐', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    this.ctx.font = '24px PingFang SC';
    this.ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Start button
    this.ctx.fillStyle = COLORS.accent;
    this.ctx.beginPath();
    this.ctx.roundRect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 + 40, 160, 50, 25);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.white;
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
}
```

---

### Task 7: Entry Point

- [ ] **7.1 Create main.ts**

`src/main.ts`:
```typescript
import { Game } from './game/Game';
import { GameState } from './types';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Handle menu click
canvas.addEventListener('click', () => {
  if (game.getState() === GameState.Menu) {
    game.startLevel(1);
  }
});

// Game loop
function gameLoop(timestamp: number): void {
  game.update(timestamp);
  game.render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

---

### Task 8: Testing & Polish

- [ ] **8.1 Run and test basic gameplay**

```bash
cd /c/Users/fsycbi001/love-match
npm run dev
```

Test in browser:
- Game loads with menu screen
- Click starts level 1
- Cards are displayed in layers
- Clicking cards adds to slot
- 3 matching cards are removed
- Slot full = game over
- All cards removed = level complete

- [ ] **8.2 Fix any issues found during testing**

Debug and fix:
- Card click detection
- Slot matching logic
- Animation smoothness
- Mobile touch support

---

## Success Criteria

1. Game loads and displays menu
2. Click/touch starts game
3. Cards can be selected and added to slot
4. 3 matching cards are automatically removed
5. Game detects win/lose conditions
6. Animations are smooth (60fps)
7. Works on mobile browsers

---

## Next Phase

Phase 2 will add:
- Easter egg system (HeartRain, KissFireworks, RoseBlessing, BegoniaSecret)
- Particle effects
- Sound effects
- More levels
- Props system
