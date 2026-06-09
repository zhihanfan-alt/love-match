import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export class Fireworks {
  private systems: ParticleSystem[] = [];
  private timer: number = 0;
  private duration: number;
  private interval: number = 0.3;

  constructor(duration: number = 3) {
    this.duration = duration;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime;

    if (this.timer >= this.interval && this.timer < this.duration) {
      this.timer = 0;
      this.launch();
    }

    for (let i = this.systems.length - 1; i >= 0; i--) {
      this.systems[i].update(deltaTime);
      if (this.systems[i].isEmpty()) {
        const last = this.systems.length - 1;
        if (i !== last) this.systems[i] = this.systems[last];
        this.systems.pop();
      }
    }

    return this.timer >= this.duration && this.systems.length === 0;
  }

  private launch(): void {
    const system = new ParticleSystem();
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT * 0.5;

    const colors = ['#FF69B4', '#FFB7C5', '#FF4D6D', '#FFD700', '#DDA0DD'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    system.addParticles(50, {
      x,
      y,
      vx: 0,
      vy: 0,
      life: 1,
      size: 3,
      color,
      gravity: 0.05,
      friction: 0.98,
    }, {
      vx: 8,
      vy: 8,
      life: 0.5,
      size: 2,
    });

    this.systems.push(system);
  }

  reset(duration?: number): void {
    this.systems.length = 0;
    this.timer = 0;
    if (duration !== undefined) this.duration = duration;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.systems.forEach(s => s.render(ctx));
  }
}
