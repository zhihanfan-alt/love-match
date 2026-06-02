import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH } from '../constants';

export class Hearts {
  private system: ParticleSystem;
  private timer: number = 0;
  private duration: number;
  private spawnRate: number = 0.1;

  constructor(duration: number = 5) {
    this.system = new ParticleSystem();
    this.duration = duration;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime;

    if (this.timer < this.duration) {
      // Spawn hearts from top
      if (Math.random() < this.spawnRate) {
        this.system.addParticle({
          x: Math.random() * CANVAS_WIDTH,
          y: -20,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 1,
          life: 3,
          size: Math.random() * 10 + 10,
          color: '#FF69B4',
          gravity: 0.02,
          friction: 0.99,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
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
    // Render hearts as emoji
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
      ctx.fillText('\u{1F495}', 0, 0);
      ctx.restore();
    });
  }
}
