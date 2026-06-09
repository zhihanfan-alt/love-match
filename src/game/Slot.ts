import { Card } from './Card';
import { Position, CardType } from '../types';
import { CANVAS_WIDTH, CARD_EMOJIS } from '../constants';

export class Slot {
  private cards: Card[] = [];
  private positions: Position[] = [];
  private maxCards: number;
  private slotCardSize: number;
  private slotY: number;
  private slotGap: number;
  private breathePhase: number = 0;
  private dangerPulse: number = 0;
  private prevDangerLevel: number = 0;

  constructor(maxCards: number, cardSize: number, slotY: number) {
    this.maxCards = maxCards;
    this.slotCardSize = Math.round(cardSize * 0.83);
    this.slotY = slotY;
    this.slotGap = Math.max(4, Math.round(cardSize * 0.13));
    this.calculatePositions();
  }

  private calculatePositions(): void {
    const totalWidth = this.maxCards * (this.slotCardSize + this.slotGap) - this.slotGap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    for (let i = 0; i < this.maxCards; i++) {
      this.positions.push({
        x: startX + i * (this.slotCardSize + this.slotGap),
        y: this.slotY,
      });
    }
  }

  addCard(card: Card): boolean {
    if (this.cards.length >= this.maxCards) {
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
    return this.cards.length >= this.maxCards;
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  getCardCount(): number {
    return this.cards.length;
  }

  getMaxCards(): number {
    return this.maxCards;
  }

  /** 0=safe, 1=warning (≤2 slots left), 2=danger (≤1 slot left) */
  getDangerLevel(): number {
    const remaining = this.maxCards - this.cards.length;
    if (remaining <= 1) return 2;
    if (remaining <= 2) return 1;
    return 0;
  }

  /** Returns true if danger level just increased since last call */
  checkDangerEscalated(): boolean {
    const current = this.getDangerLevel();
    const escalated = current > this.prevDangerLevel;
    this.prevDangerLevel = current;
    return escalated;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const scs = this.slotCardSize;
    const totalWidth = this.maxCards * (scs + this.slotGap) - this.slotGap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2 - 12;
    const slotHeight = scs + 16;

    // Breathe phase for empty slot pulse
    this.breathePhase += 0.03;
    const breathe = 0.5 + Math.sin(this.breathePhase) * 0.2;

    // Danger pulse
    const dangerLevel = this.getDangerLevel();
    this.dangerPulse += dangerLevel > 0 ? 0.08 : 0;
    const dangerPulseVal = Math.sin(this.dangerPulse * 3) * 0.5 + 0.5;

    // Shake offset for danger state
    let shakeX = 0;
    let shakeY = 0;
    if (dangerLevel >= 2) {
      shakeX = (Math.random() - 0.5) * 2 * dangerPulseVal;
      shakeY = (Math.random() - 0.5) * 1.5 * dangerPulseVal;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Glassmorphism background — gradient fill
    const bgGrad = ctx.createLinearGradient(startX, this.slotY - 8, startX, this.slotY - 8 + slotHeight);
    bgGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
    bgGrad.addColorStop(1, 'rgba(100,200,255,0.08)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(startX, this.slotY - 8, totalWidth + 24, slotHeight, 16);
    ctx.fill();

    // Slot border — danger-aware color
    let borderColor = 'rgba(100,200,255,0.4)';
    let borderWidth = 1.5;
    if (dangerLevel === 1) {
      borderColor = `rgba(255,165,0,${0.5 + dangerPulseVal * 0.3})`;
      borderWidth = 2;
    } else if (dangerLevel === 2) {
      borderColor = `rgba(255,60,60,${0.6 + dangerPulseVal * 0.4})`;
      borderWidth = 2.5;
    }
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // Danger glow effect
    if (dangerLevel >= 1) {
      ctx.shadowColor = dangerLevel >= 2 ? 'rgba(255,60,60,0.5)' : 'rgba(255,165,0,0.4)';
      ctx.shadowBlur = 8 + dangerPulseVal * 6;
      ctx.beginPath();
      ctx.roundRect(startX, this.slotY - 8, totalWidth + 24, slotHeight, 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Empty slot indicators — breathing dashed outlines
    for (let i = 0; i < this.maxCards; i++) {
      const pos = this.positions[i];
      const isFilled = i < this.cards.length;
      ctx.strokeStyle = isFilled
        ? 'rgba(100,200,255,0.6)'
        : `rgba(255,105,180,${0.15 + breathe * 0.15})`;
      ctx.lineWidth = isFilled ? 1.5 : 1;
      ctx.setLineDash(isFilled ? [] : [4, 3]);
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, scs, scs, 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render cards in slot
    this.cards.forEach((card, index) => {
      const pos = this.positions[index];
      if (!pos) return;

      ctx.save();
      ctx.translate(pos.x + scs / 2, pos.y + scs / 2);

      // Card bg with gradient
      const cardGrad = ctx.createRadialGradient(0, -scs * 0.1, scs * 0.05, 0, 0, scs * 0.6);
      cardGrad.addColorStop(0, 'rgba(255,255,255,0.97)');
      cardGrad.addColorStop(1, 'rgba(200,230,255,0.9)');
      ctx.fillStyle = cardGrad;
      ctx.beginPath();
      ctx.roundRect(-scs / 2, -scs / 2, scs, scs, 8);
      ctx.fill();

      // Glowing border
      ctx.strokeStyle = 'rgba(100,200,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const emojiSize = Math.round(scs * 0.48);
      ctx.font = `${emojiSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CARD_EMOJIS[card.type], 0, 0);

      ctx.restore();
    });

    ctx.restore();
  }
}
