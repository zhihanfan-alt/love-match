import { EasterEgg } from './EasterEgg';
import { Hearts } from '../effects/Hearts';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class HeartRain implements EasterEgg {
  name = 'Heart Rain';
  triggerType = CardType.Heart;
  duration = 3;
  isActive = false;

  private remaining: number = 0;
  private hearts: Hearts;
  private flashOpacity = 0;
  private textOpacity = 0;
  private textTimer = 0;

  constructor() {
    this.hearts = new Hearts(this.duration, 0.25);
  }

  activate(): void {
    this.isActive = true;
    this.remaining = this.duration;
    this.hearts.reset();
    this.flashOpacity = 0.6;
    this.textOpacity = 0;
    this.textTimer = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Flash fades out quickly
    if (this.flashOpacity > 0) {
      this.flashOpacity -= deltaTime * 2;
      if (this.flashOpacity < 0) this.flashOpacity = 0;
    }

    // Show text after 0.5s
    this.textTimer += deltaTime;
    if (this.textTimer > 0.5 && this.textOpacity < 1) {
      this.textOpacity += deltaTime * 3;
    }

    const done = this.hearts.update(deltaTime);
    this.remaining -= deltaTime;
    if (done || this.remaining <= 0) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // White flash overlay
    if (this.flashOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashOpacity;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }

    // Hearts
    this.hearts.render(ctx);

    // Text
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(this.textOpacity, 1);
      ctx.fillStyle = COLORS.textWhite;
      ctx.font = 'bold 36px PingFang SC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F495} 爱心雨 \u{1F495}', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  }
}
