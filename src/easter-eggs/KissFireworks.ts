import { EasterEgg } from './EasterEgg';
import { ParticleSystem } from '../effects/ParticleSystem';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class KissFireworks implements EasterEgg {
  name = 'Kiss Fireworks';
  triggerType = CardType.Kiss;
  duration = 5;
  isActive = false;

  private burst!: ParticleSystem;
  private heartParticles!: ParticleSystem;
  private phase = 0;
  private timer = 0;
  private heartT = 0;
  private textOpacity = 0;

  activate(): void {
    this.isActive = true;
    this.phase = 0;
    this.timer = 0;
    this.heartT = 0;
    this.textOpacity = 0;
    this.launchBurst();
    this.heartParticles = new ParticleSystem();
  }

  deactivate(): void {
    this.isActive = false;
  }

  private launchBurst(): void {
    this.burst = new ParticleSystem();
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const colors = ['#FF69B4', '#FFB7C5', '#FF4D6D', '#FFD700', '#DDA0DD'];

    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80;
      const speed = 4 + Math.random() * 6;
      this.burst.addParticle({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1 + Math.random() * 0.5,
        size: 4 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.02,
        friction: 0.97,
      });
    }
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    this.timer += deltaTime;

    // Phase 0: Center burst (0-2s)
    if (this.phase === 0) {
      this.burst.update(deltaTime);
      if (this.timer >= 2) {
        this.phase = 1;
        this.timer = 0;
      }
    }

    // Phase 1: Heart-shaped trail + text (2-5s)
    if (this.phase === 1) {
      this.heartParticles.update(deltaTime);

      // Emit particles along heart curve
      if (this.timer < 2.5) {
        this.heartT += deltaTime * 4;
        const scale = 10;
        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 2 - 30;
        // Heart parametric equation
        const hx = 16 * Math.pow(Math.sin(this.heartT), 3);
        const hy = 13 * Math.cos(this.heartT) - 5 * Math.cos(2 * this.heartT) - 2 * Math.cos(3 * this.heartT) - Math.cos(4 * this.heartT);

        this.heartParticles.addParticle({
          x: cx + hx * scale,
          y: cy - hy * scale,
          vx: (Math.random() - 0.5) * 1,
          vy: Math.random() * 0.5 + 0.3,
          life: 1.5 + Math.random() * 0.5,
          size: 3 + Math.random() * 2,
          color: '#FF69B4',
          gravity: 0,
          friction: 0.99,
        });
      }

      if (this.timer > 0.3 && this.textOpacity < 1) {
        this.textOpacity += deltaTime;
      }

      if (this.timer >= 3) {
        this.deactivate();
        return true;
      }
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Phase 0: Burst particles
    if (this.phase === 0) {
      this.burst.render(ctx);
    }

    // Phase 1: Heart trail particles + text
    if (this.phase === 1) {
      // Center glow
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(this.timer * 4) * 0.1;
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2 - 30;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
      grad.addColorStop(0, 'rgba(255, 105, 180, 0.3)');
      grad.addColorStop(1, 'rgba(255, 105, 180, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 100, cy - 100, 200, 200);
      ctx.restore();

      this.heartParticles.render(ctx);

      if (this.textOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = this.textOpacity;
        ctx.fillStyle = COLORS.textWhite;
        ctx.font = 'bold 48px PingFang SC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u{1F618} 爱你哟~', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        ctx.restore();
      }
    }
  }
}
