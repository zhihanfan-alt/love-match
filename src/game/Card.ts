import { CardData, CardType, Position } from '../types';
import { CARD_SIZE, CARD_RADIUS, COLORS, CARD_EMOJIS } from '../constants';

export class Card implements CardData {
  id: number;
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

  constructor(id: number, type: CardType, position: Position, layer: number) {
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
