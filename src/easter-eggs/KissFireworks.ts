import { EasterEgg } from './EasterEgg';
import { Fireworks } from '../effects/Fireworks';
import { Hearts } from '../effects/Hearts';
import { RosePetals } from '../effects/RosePetals';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class KissFireworks implements EasterEgg {
  name = 'Kiss Fireworks';
  triggerType = CardType.Kiss;
  duration = 8;
  isActive = false;

  private fireworks: Fireworks;
  private hearts: Hearts;
  private petals: RosePetals;
  private phase = 0;
  private timer = 0;
  private textOpacity = 0;

  constructor() {
    this.fireworks = new Fireworks(3);
    this.hearts = new Hearts(5);
    this.petals = new RosePetals(5);
  }

  activate(): void {
    this.isActive = true;
    this.fireworks = new Fireworks(3);
    this.hearts = new Hearts(5);
    this.petals = new RosePetals(5);
    this.phase = 0;
    this.timer = 0;
    this.textOpacity = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    this.timer += deltaTime;

    // Phase 0: Fireworks (0-3s)
    if (this.phase === 0) {
      const done = this.fireworks.update(deltaTime);
      if (done) {
        this.phase = 1;
        this.timer = 0;
      }
    }

    // Phase 1: Hearts + Petals (3-8s)
    if (this.phase === 1) {
      this.hearts.update(deltaTime);
      this.petals.update(deltaTime);

      // Show text after 1 second in phase 1
      if (this.timer > 1 && this.textOpacity < 1) {
        this.textOpacity += deltaTime;
      }

      if (this.timer >= 5) {
        this.deactivate();
        return true;
      }
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Phase 0: Fireworks
    if (this.phase === 0) {
      this.fireworks.render(ctx);
    }

    // Phase 1: Hearts + Petals + Text
    if (this.phase === 1) {
      this.hearts.render(ctx);
      this.petals.render(ctx);

      // Text
      if (this.textOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = this.textOpacity;
        ctx.fillStyle = COLORS.textWhite;
        ctx.font = 'bold 48px PingFang SC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u{1F618} 爱你哟~', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.restore();
      }
    }
  }
}
