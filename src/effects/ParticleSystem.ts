import { Particle, ParticleConfig } from './Particle';

export class ParticleSystem {
  private particles: Particle[] = [];

  addParticle(config: ParticleConfig): void {
    this.particles.push(new Particle(config));
  }

  addParticles(count: number, baseConfig: Partial<ParticleConfig>, randomize?: Partial<ParticleConfig>): void {
    for (let i = 0; i < count; i++) {
      const config: ParticleConfig = {
        x: baseConfig.x ?? 0,
        y: baseConfig.y ?? 0,
        vx: baseConfig.vx ?? 0,
        vy: baseConfig.vy ?? 0,
        life: baseConfig.life ?? 1,
        size: baseConfig.size ?? 4,
        color: baseConfig.color ?? '#FFB7C5',
        gravity: baseConfig.gravity ?? 0.1,
        friction: baseConfig.friction ?? 0.99,
        opacity: baseConfig.opacity ?? 1,
        rotation: baseConfig.rotation ?? 0,
        rotationSpeed: baseConfig.rotationSpeed ?? 0,
      };

      if (randomize) {
        if (randomize.x !== undefined) config.x += (Math.random() - 0.5) * randomize.x;
        if (randomize.y !== undefined) config.y += (Math.random() - 0.5) * randomize.y;
        if (randomize.vx !== undefined) config.vx += (Math.random() - 0.5) * randomize.vx;
        if (randomize.vy !== undefined) config.vy += (Math.random() - 0.5) * randomize.vy;
        if (randomize.life !== undefined) config.life += (Math.random() - 0.5) * randomize.life;
        if (randomize.size !== undefined) config.size += (Math.random() - 0.5) * randomize.size;
      }

      this.particles.push(new Particle(config));
    }
  }

  update(deltaTime: number): void {
    this.particles = this.particles.filter(p => {
      p.update(deltaTime);
      return !p.isDead;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => p.render(ctx));
  }

  clear(): void {
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  isEmpty(): boolean {
    return this.particles.length === 0;
  }
}
