import { EasterEgg } from './EasterEgg';
import { Hearts } from '../effects/Hearts';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class HeartRain implements EasterEgg {
  name = 'Heart Rain';
  triggerType = CardType.Heart;
  duration = 5;
  isActive = false;

  private hearts: Hearts;
  private backgroundOpacity = 0;
  private textOpacity = 0;
  private textTimer = 0;

  constructor() {
    this.hearts = new Hearts(this.duration);
  }

  activate(): void {
    this.isActive = true;
    this.hearts = new Hearts(this.duration);
    this.backgroundOpacity = 0;
    this.textOpacity = 0;
    this.textTimer = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Fade in background
    if (this.backgroundOpacity < 0.3) {
      this.backgroundOpacity += deltaTime * 0.2;
    }

    // Show text after 1 second
    this.textTimer += deltaTime;
    if (this.textTimer > 1 && this.textOpacity < 1) {
      this.textOpacity += deltaTime;
    }

    const done = this.hearts.update(deltaTime);
    if (done) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Pink overlay
    ctx.save();
    ctx.globalAlpha = this.backgroundOpacity;
    ctx.fillStyle = COLORS.bgGradientStart;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // Hearts
    this.hearts.render(ctx);

    // Text
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;
      ctx.fillStyle = COLORS.textWhite;
      ctx.font = 'bold 36px PingFang SC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F495} 爱心雨 \u{1F495}', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  }
}
