import { CardData, CardType, Position } from '../types';
import { CARD_EMOJIS } from '../constants';
import { animateCardMove, animateCardSnap, animateClick, killTweensOf } from '../animation/GSAPAnimations';

/** Map card types to their accent glow colours */
const TYPE_GLOW: Record<CardType, string> = {
  [CardType.Heart]: '#ff6b9d',
  [CardType.Kiss]: '#c084fc',
  [CardType.Rose]: '#f472b6',
  [CardType.Begonia]: '#fb923c',
  [CardType.Star]: '#fbbf24',
  [CardType.Moon]: '#818cf8',
  [CardType.Gift]: '#34d399',
  [CardType.Gem]: '#22d3ee',
};

interface Ripple {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export class Card implements CardData {
  id: number;
  type: CardType;
  position: Position;
  layer: number;
  isRemoved: boolean;

  private cardSize: number;
  private cardRadius: number;
  private emojiSize: number;
  private originalPosition: Position | null = null;
  scale: number = 1;
  private opacity: number = 1;
  private ripples: Ripple[] = [];

  constructor(id: number, type: CardType, position: Position, layer: number, cardSize: number = 60) {
    this.id = id;
    this.type = type;
    this.position = { ...position };
    this.layer = layer;
    this.isRemoved = false;
    this.cardSize = cardSize;
    this.cardRadius = Math.round(cardSize * 0.22);
    this.emojiSize = Math.round(cardSize * 0.53);
  }

  update(_deltaTime: number): void {
    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += (r.maxRadius - r.radius) * 0.15;
      r.alpha -= _deltaTime * 3.5;
      if (r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  triggerRipple(): void {
    const glow = TYPE_GLOW[this.type] ?? '#64c8ff';
    this.ripples.push({
      radius: 0,
      maxRadius: this.cardSize * 0.8,
      alpha: 0.7,
      color: glow,
    });
  }

  playClickAnimation(): void {
    animateClick(this);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isRemoved) return;

    const s = this.cardSize;
    const r = this.cardRadius;
    const glow = TYPE_GLOW[this.type] ?? '#64c8ff';

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x + s / 2, this.position.y + s / 2);
    ctx.scale(this.scale, this.scale);

    // Outer glow — type-colored, enhanced by layer depth
    const layerDepth = Math.min(this.layer, 7);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10 + layerDepth * 3;
    ctx.shadowOffsetY = 3 + layerDepth * 1.5;
    ctx.shadowOffsetX = layerDepth * 0.8;

    // Card background — radial gradient (bright center → subtle tint)
    this.drawRoundRect(ctx, -s / 2, -s / 2, s, s, r);
    const grad = ctx.createRadialGradient(0, -s * 0.15, s * 0.05, 0, 0, s * 0.7);
    grad.addColorStop(0, 'rgba(255,255,255,0.97)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.93)');
    grad.addColorStop(1, this.hexToRgba(glow, 0.12));
    ctx.fillStyle = grad;
    ctx.fill();

    // Darken lower-layer cards to indicate depth
    if (this.layer > 0) {
      const darken = Math.min(this.layer * 0.06, 0.25);
      this.drawRoundRect(ctx, -s / 2, -s / 2, s, s, r);
      ctx.fillStyle = `rgba(0,0,0,${darken})`;
      ctx.fill();
    }

    // Gloss border — thin white semi-transparent
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner edge highlight (top-left)
    const innerGrad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    innerGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
    innerGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0.03)');
    this.drawRoundRect(ctx, -s / 2 + 1, -s / 2 + 1, s - 2, s - 2, r - 1);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Emoji
    ctx.font = `${this.emojiSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CARD_EMOJIS[this.type], 0, 0);

    // Ripple effects
    for (const ripple of this.ripples) {
      ctx.beginPath();
      ctx.arc(0, 0, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.hexToRgba(ripple.color, ripple.alpha);
      ctx.lineWidth = 3;
      ctx.stroke();
    }

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

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  moveTo(target: Position): void {
    animateCardMove(this.position, target);
  }

  saveOriginalPosition(): void {
    this.originalPosition = { ...this.position };
  }

  restoreOriginalPosition(): void {
    if (this.originalPosition) {
      killTweensOf(this.position);
      animateCardSnap(this.position, this.originalPosition);
      this.originalPosition = null;
    }
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  setOpacity(value: number): void {
    this.opacity = value;
  }

  containsPoint(x: number, y: number): boolean {
    const halfSize = (this.cardSize / 2) * this.scale;
    const cx = this.position.x + this.cardSize / 2;
    const cy = this.position.y + this.cardSize / 2;
    return (
      x >= cx - halfSize && x <= cx + halfSize &&
      y >= cy - halfSize && y <= cy + halfSize
    );
  }

  getCardSize(): number {
    return this.cardSize;
  }

  killAnimations(): void {
    killTweensOf(this.position);
    killTweensOf(this);
  }
}
