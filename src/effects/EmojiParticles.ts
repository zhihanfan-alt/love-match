import { ParticleSystem } from './ParticleSystem';
import { ParticleConfig } from './Particle';
import { CANVAS_WIDTH } from '../constants';

export class EmojiParticles {
  private system: ParticleSystem;
  private timer: number = 0;
  private duration: number;
  private emoji: string;
  private spawnRate: number;
  private spawnConfig: Partial<ParticleConfig>;

  constructor(emoji: string, spawnConfig: Partial<ParticleConfig>, duration = 5, spawnRate = 0.15) {
    this.system = new ParticleSystem();
    this.duration = duration;
    this.emoji = emoji;
    this.spawnRate = spawnRate;
    this.spawnConfig = spawnConfig;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime;

    if (this.timer < this.duration) {
      if (Math.random() < this.spawnRate) {
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
          ...this.spawnConfig,
        });
      }
    }

    this.system.update(deltaTime);
    return this.timer >= this.duration && this.system.isEmpty();
  }

  getParticles() {
    return this.system.getParticles();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const particles = this.system.getParticles();
    particles.forEach((p) => {
      if (p.isDead) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    });
  }
}
