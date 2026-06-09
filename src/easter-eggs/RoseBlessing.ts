import { EasterEgg } from './EasterEgg';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

class RisingPetals {
  private petals: Petal[] = [];
  private timer = 0;
  private duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  reset(): void {
    this.petals.length = 0;
    this.timer = 0;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime;

    // Spawn petals from bottom
    if (this.timer < this.duration && Math.random() < 0.2) {
      this.petals.push({
        x: Math.random() * CANVAS_WIDTH,
        y: CANVAS_HEIGHT + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -(2 + Math.random() * 2),
        size: 14 + Math.random() * 8,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      });
    }

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;
      p.vy += 0.01; // slight deceleration
      p.vx += Math.sin(p.y * 0.01) * 0.05; // drift
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, p.y / CANVAS_HEIGHT);

      if (p.y < -30 || p.opacity <= 0) {
        this.petals.splice(i, 1);
      }
    }

    return this.timer >= this.duration && this.petals.length === 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.petals) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size | 0}px Arial`;
      ctx.fillText('🌹', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

export class RoseBlessing implements EasterEgg {
  name = 'Rose Blessing';
  triggerType = CardType.Rose;
  duration = 10;
  isActive = false;
  private propBoost: number = 1.5;
  private remaining: number = 0;

  private petals: RisingPetals;
  private borderPulse = 0;
  private textOpacity = 0;

  constructor() {
    this.petals = new RisingPetals(this.duration);
  }

  activate(): void {
    this.isActive = true;
    this.remaining = this.duration;
    this.petals.reset();
    this.borderPulse = 0;
    this.textOpacity = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    this.borderPulse += deltaTime;
    this.petals.update(deltaTime);

    // Text: fade in 0-1s, hold 1-3s, fade out 3-4s, hidden after 4s
    if (this.borderPulse < 1) {
      this.textOpacity = this.borderPulse;
    } else if (this.borderPulse < 3) {
      this.textOpacity = 1;
    } else if (this.borderPulse < 4) {
      this.textOpacity = 1 - (this.borderPulse - 3);
    } else {
      this.textOpacity = 0;
    }

    this.remaining -= deltaTime;
    if (this.remaining <= 0) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Breathing border pulse: opacity oscillates between 0.2 and 0.6
    const pulse = 0.4 + Math.sin(this.borderPulse * 3) * 0.2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = COLORS.heart;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
    ctx.restore();

    // Rising petals
    this.petals.render(ctx);

    // Text
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.textOpacity);
      ctx.fillStyle = COLORS.textWhite;
      ctx.font = 'bold 20px PingFang SC';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F339} 玫瑰祝福 - 道具增强50%', CANVAS_WIDTH / 2, 30);
      ctx.restore();
    }
  }

  getBoost(): number {
    return this.isActive ? this.propBoost : 1;
  }
}
