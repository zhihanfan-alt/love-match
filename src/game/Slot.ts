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

    card.saveOriginalPosition();
    this.cards.push(card);
    const targetPos = this.positions[this.cards.length - 1];
    card.moveTo(targetPos);

    return true;
  }

  removeLast(n: number): Card[] {
    const removed: Card[] = [];
    for (let i = 0; i < n && this.cards.length > 0; i++) {
      const card = this.cards.pop();
      if (card) {
        removed.push(card);
      }
    }
    this.repositionCards();
    return removed;
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
