import { EasterEgg } from './EasterEgg';
import { RosePetals } from '../effects/RosePetals';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class RoseBlessing implements EasterEgg {
  name = 'Rose Blessing';
  triggerType = CardType.Rose;
  duration = 30;
  isActive = false;
  private propBoost: number = 1.5; // 50% boost
  private remaining: number = 0;

  private petals: RosePetals;
  private borderOpacity = 0;

  constructor() {
    this.petals = new RosePetals(5);
  }

  activate(): void {
    this.isActive = true;
    this.remaining = this.duration;
    this.petals = new RosePetals(5);
    this.borderOpacity = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Fade in border
    if (this.borderOpacity < 1) {
      this.borderOpacity += deltaTime * 2;
    }

    this.petals.update(deltaTime);

    // Deactivate after duration
    this.remaining -= deltaTime;
    if (this.remaining <= 0) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Rose border
    ctx.save();
    ctx.globalAlpha = this.borderOpacity * 0.5;
    ctx.strokeStyle = COLORS.heart;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
    ctx.restore();

    // Petals
    this.petals.render(ctx);

    // Status text
    ctx.save();
    ctx.globalAlpha = this.borderOpacity;
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 20px PingFang SC';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1F339} 玫瑰祝福 - 道具增强50%', CANVAS_WIDTH / 2, 30);
    ctx.restore();
  }

  getPropBoost(): number {
    return this.isActive ? this.propBoost : 1;
  }

  getBoost(): number {
    return this.isActive ? this.propBoost : 1;
  }
}
