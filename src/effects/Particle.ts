export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  gravity?: number;
  friction?: number;
  opacity?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  life: number = 0;
  maxLife: number = 0;
  size: number = 0;
  color: string = '';
  gravity: number = 0.1;
  friction: number = 0.99;
  opacity: number = 1;
  rotation: number = 0;
  rotationSpeed: number = 0;
  isDead: boolean = true;

  constructor(config?: ParticleConfig) {
    if (config) this.reset(config);
  }

  reset(config: ParticleConfig): void {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.life = config.life;
    this.maxLife = config.life;
    this.size = config.size;
    this.color = config.color;
    this.gravity = config.gravity ?? 0.1;
    this.friction = config.friction ?? 0.99;
    this.opacity = config.opacity ?? 1;
    this.rotation = config.rotation ?? 0;
    this.rotationSpeed = config.rotationSpeed ?? 0;
    this.isDead = false;
  }

  update(deltaTime: number): void {
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.vy += this.gravity * deltaTime;
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    this.rotation += this.rotationSpeed * deltaTime;
    this.opacity = Math.max(0, this.life / this.maxLife);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
