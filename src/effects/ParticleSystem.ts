import { Particle, ParticleConfig } from './Particle';

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private static readonly POOL_PREWARM = 100;

  constructor() {
    this.prewarm(ParticleSystem.POOL_PREWARM);
  }

  private prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(new Particle());
    }
  }

  private acquire(config: ParticleConfig): Particle {
    let p = this.pool.pop();
    if (!p) p = new Particle();
    p.reset(config);
    return p;
  }

  private release(p: Particle): void {
    p.isDead = true;
    this.pool.push(p);
  }

  addParticle(config: ParticleConfig): void {
    this.particles.push(this.acquire(config));
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

      this.particles.push(this.acquire(config));
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (this.particles[i].isDead) {
        this.release(this.particles[i]);
        const last = this.particles.length - 1;
        if (i !== last) this.particles[i] = this.particles[last];
        this.particles.pop();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => p.render(ctx));
  }

  clear(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.release(this.particles[i]);
    }
    this.particles.length = 0;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  isEmpty(): boolean {
    return this.particles.length === 0;
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }
}
