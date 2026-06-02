import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH } from '../constants';

export class RosePetals {
  private system: ParticleSystem;
  private timer: number = 0;
  private duration: number;

  constructor(duration: number = 5) {
    this.system = new ParticleSystem();
    this.duration = duration;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime;

    if (this.timer < this.duration) {
      // Spawn petals from top
      if (Math.random() < 0.15) {
        this.system.addParticle({
          x: Math.random() * CANVAS_WIDTH,
          y: -20,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 1,
          life: 4,
          size: Math.random() * 8 + 6,
          color: '#FF69B4',
          gravity: 0.03,
          friction: 0.99,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
    }

    this.system.update(deltaTime);
    return this.timer >= this.duration && this.system.isEmpty();
  }

  // Expose particles for emoji rendering
  getParticles(): import('./Particle').Particle[] {
    return (this.system as any).particles;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const particles = this.getParticles();
    particles.forEach((p) => {
      if (p.isDead) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F339}', 0, 0);
      ctx.restore();
    });
  }
}
