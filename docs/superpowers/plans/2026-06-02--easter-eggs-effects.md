# Love Match - Phase 2: Easter Eggs & Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add easter egg system, particle effects, audio, and props to the Love Match game.

**Architecture:** Event-driven easter egg system with particle effects rendered on Canvas. Audio managed via Web Audio API. Props system with cooldown and visual feedback.

**Tech Stack:** HTML5 Canvas, TypeScript, Web Audio API

---

## File Structure

```
love-match/
├── src/
│   ├── effects/
│   │   ├── Particle.ts          # Base particle class
│   │   ├── ParticleSystem.ts    # Particle system manager
│   │   ├── Fireworks.ts         # Firework effect
│   │   ├── Hearts.ts            # Heart rain effect
│   │   ├── RosePetals.ts        # Rose petal effect
│   │   └── BegoniaPetals.ts     # Begonia petal effect
│   ├── easter-eggs/
│   │   ├── EasterEgg.ts         # Base easter egg interface
│   │   ├── EasterEggManager.ts  # Manager for all easter eggs
│   │   ├── HeartRain.ts         # Heart rain easter egg
│   │   ├── KissFireworks.ts     # Kiss fireworks easter egg
│   │   ├── RoseBlessing.ts      # Rose blessing easter egg
│   │   └── BegoniaSecret.ts     # Begonia secret level
│   ├── audio/
│   │   └── AudioManager.ts      # Audio management
│   └── props/
│       ├── Prop.ts              # Base prop class
│       └── PropManager.ts       # Props management
└── assets/
    └── sounds/
        └── README.md            # Sound files placeholder
```

---

## Implementation Tasks

### Task 1: Particle System Base

- [ ] **1.1 Create Particle class**

`src/effects/Particle.ts`:
```typescript
import { Position } from '../types';

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
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  friction: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  isDead: boolean = false;

  constructor(config: ParticleConfig) {
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
```

- [ ] **1.2 Create ParticleSystem class**

`src/effects/ParticleSystem.ts`:
```typescript
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
```

- [ ] **1.3 Create Fireworks effect**

`src/effects/Fireworks.ts`:
```typescript
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

    this.systems = this.systems.filter(s => {
      s.update(deltaTime);
      return !s.isEmpty();
    });

    return this.timer >= this.duration && this.systems.length === 0;
  }

  private launch(): void {
    const system = new ParticleSystem();
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT * 0.5;

    // Firework burst
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

  render(ctx: CanvasRenderingContext2D): void {
    this.systems.forEach(s => s.render(ctx));
  }
}
```

- [ ] **1.4 Create Hearts effect**

`src/effects/Hearts.ts`:
```typescript
import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

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

  render(ctx: CanvasRenderingContext2D): void {
    // Render hearts as emoji
    const particles = (this.system as any).particles;
    particles.forEach((p: any) => {
      if (p.isDead) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💕', p.x, p.y);
      ctx.restore();
    });
  }
}
```

- [ ] **1.5 Create RosePetals effect**

`src/effects/RosePetals.ts`:
```typescript
import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

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

  render(ctx: CanvasRenderingContext2D): void {
    const particles = (this.system as any).particles;
    particles.forEach((p: any) => {
      if (p.isDead) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌹', 0, 0);
      ctx.restore();
    });
  }
}
```

- [ ] **1.6 Create BegoniaPetals effect**

`src/effects/BegoniaPetals.ts`:
```typescript
import { ParticleSystem } from './ParticleSystem';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export class BegoniaPetals {
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
          color: '#FF4D6D',
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

  render(ctx: CanvasRenderingContext2D): void {
    const particles = (this.system as any).particles;
    particles.forEach((p: any) => {
      if (p.isDead) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌸', 0, 0);
      ctx.restore();
    });
  }
}
```

---

### Task 2: Easter Egg System

- [ ] **2.1 Create EasterEgg interface**

`src/easter-eggs/EasterEgg.ts`:
```typescript
import { CardType } from '../types';

export interface EasterEgg {
  name: string;
  triggerType: CardType;
  duration: number;
  isActive: boolean;
  update(deltaTime: number): boolean;
  render(ctx: CanvasRenderingContext2D): void;
  activate(): void;
  deactivate(): void;
}
```

- [ ] **2.2 Create HeartRain easter egg**

`src/easter-eggs/HeartRain.ts`:
```typescript
import { EasterEgg } from './EasterEgg';
import { Hearts } from '../effects/Hearts';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class HeartRain implements EasterEgg {
  name: string = 'Heart Rain';
  triggerType: CardType = CardType.Heart;
  duration: number = 5;
  isActive: boolean = false;

  private hearts: Hearts;
  private backgroundOpacity: number = 0;
  private textOpacity: number = 0;
  private textTimer: number = 0;

  constructor() {
    this.hearts = new Hearts(this.duration);
  }

  activate(): void {
    this.isActive = true;
    this.hearts = new Hearts(this.duration);
    this.backgroundOpacity = 0;
    this.textOpacity = 0;
    this.textTimer = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Fade in background
    if (this.backgroundOpacity < 0.3) {
      this.backgroundOpacity += deltaTime * 0.2;
    }

    // Show text after 1 second
    this.textTimer += deltaTime;
    if (this.textTimer > 1 && this.textOpacity < 1) {
      this.textOpacity += deltaTime;
    }

    const done = this.hearts.update(deltaTime);
    if (done) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Pink overlay
    ctx.save();
    ctx.globalAlpha = this.backgroundOpacity;
    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // Hearts
    this.hearts.render(ctx);

    // Text
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;
      ctx.fillStyle = COLORS.white;
      ctx.font = 'bold 36px PingFang SC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💕 爱心雨 💕', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  }
}
```

- [ ] **2.3 Create KissFireworks easter egg**

`src/easter-eggs/KissFireworks.ts`:
```typescript
import { EasterEgg } from './EasterEgg';
import { Fireworks } from '../effects/Fireworks';
import { Hearts } from '../effects/Hearts';
import { RosePetals } from '../effects/RosePetals';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class KissFireworks implements EasterEgg {
  name: string = 'Kiss Fireworks';
  triggerType: CardType = CardType.Kiss;
  duration: number = 8;
  isActive: boolean = false;

  private fireworks: Fireworks;
  private hearts: Hearts;
  private petals: RosePetals;
  private phase: number = 0;
  private timer: number = 0;
  private textOpacity: number = 0;

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
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 48px PingFang SC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('😘 爱你哟~', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.restore();
      }
    }
  }
}
```

- [ ] **2.4 Create RoseBlessing easter egg**

`src/easter-eggs/RoseBlessing.ts`:
```typescript
import { EasterEgg } from './EasterEgg';
import { RosePetals } from '../effects/RosePetals';
import { CardType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

export class RoseBlessing implements EasterEgg {
  name: string = 'Rose Blessing';
  triggerType: CardType = CardType.Rose;
  duration: number = 30;
  isActive: boolean = false;
  propBoost: number = 1.5; // 50% boost

  private petals: RosePetals;
  private borderOpacity: number = 0;

  constructor() {
    this.petals = new RosePetals(5);
  }

  activate(): void {
    this.isActive = true;
    this.petals = new RosePetals(5);
    this.borderOpacity = 0;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Fade in border
    if (this.borderOpacity < 1) {
      this.borderOpacity += deltaTime * 2;
    }

    this.petals.update(deltaTime);

    // Deactivate after duration
    this.duration -= deltaTime;
    if (this.duration <= 0) {
      this.deactivate();
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Rose border
    ctx.save();
    ctx.globalAlpha = this.borderOpacity * 0.5;
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
    ctx.restore();

    // Petals
    this.petals.render(ctx);

    // Status text
    ctx.save();
    ctx.globalAlpha = this.borderOpacity;
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 20px PingFang SC';
    ctx.textAlign = 'center';
    ctx.fillText('🌹 玫瑰祝福 - 道具增强50%', CANVAS_WIDTH / 2, 30);
    ctx.restore();
  }

  getPropBoost(): number {
    return this.isActive ? this.propBoost : 1;
  }
}
```

- [ ] **2.5 Create EasterEggManager**

`src/easter-eggs/EasterEggManager.ts`:
```typescript
import { EasterEgg } from './EasterEgg';
import { HeartRain } from './HeartRain';
import { KissFireworks } from './KissFireworks';
import { RoseBlessing } from './RoseBlessing';
import { CardType } from '../types';

export class EasterEggManager {
  private easterEggs: Map<CardType, EasterEgg> = new Map();
  private activeEasterEgg: EasterEgg | null = null;

  constructor() {
    this.register(new HeartRain());
    this.register(new KissFireworks());
    this.register(new RoseBlessing());
  }

  private register(easterEgg: EasterEgg): void {
    this.easterEggs.set(easterEgg.triggerType, easterEgg);
  }

  trigger(type: CardType): boolean {
    const easterEgg = this.easterEggs.get(type);
    if (!easterEgg || this.activeEasterEgg) return false;

    easterEgg.activate();
    this.activeEasterEgg = easterEgg;
    return true;
  }

  update(deltaTime: number): boolean {
    if (!this.activeEasterEgg) return false;

    const done = this.activeEasterEgg.update(deltaTime);
    if (done) {
      this.activeEasterEgg = null;
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.activeEasterEgg) {
      this.activeEasterEgg.render(ctx);
    }
  }

  isAnyActive(): boolean {
    return this.activeEasterEgg !== null;
  }

  getActiveBoost(): number {
    if (this.activeEasterEgg instanceof RoseBlessing) {
      return this.activeEasterEgg.getPropBoost();
    }
    return 1;
  }
}
```

---

### Task 3: Audio System

- [ ] **3.1 Create AudioManager**

`src/audio/AudioManager.ts`:
```typescript
export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init(): Promise<void> {
    this.audioContext = new AudioContext();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  playSound(name: string, volume: number = 1): void {
    if (!this.audioContext || this.isMuted) return;

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  playBGM(name: string, volume: number = 0.3): void {
    if (!this.audioContext || this.isMuted) return;

    this.stopBGM();

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    this.bgmSource = this.audioContext.createBufferSource();
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true;

    if (this.bgmGain) {
      this.bgmGain.gain.value = volume;
      this.bgmSource.connect(this.bgmGain);
    }

    this.bgmSource.start(0);
  }

  stopBGM(): void {
    if (this.bgmSource) {
      this.bgmSource.stop();
      this.bgmSource = null;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopBGM();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}
```

---

### Task 4: Props System

- [ ] **4.1 Create Prop class**

`src/props/Prop.ts`:
```typescript
export interface PropConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number;
  maxUses: number;
}

export class Prop {
  private config: PropConfig;
  private currentUses: number;
  private cooldownTimer: number = 0;
  private isOnCooldown: boolean = false;

  constructor(config: PropConfig) {
    this.config = config;
    this.currentUses = config.maxUses;
  }

  use(): boolean {
    if (this.isOnCooldown || this.currentUses <= 0) return false;

    this.currentUses--;
    this.isOnCooldown = true;
    this.cooldownTimer = this.config.cooldown;
    return true;
  }

  update(deltaTime: number): void {
    if (this.isOnCooldown) {
      this.cooldownTimer -= deltaTime;
      if (this.cooldownTimer <= 0) {
        this.isOnCooldown = false;
        this.cooldownTimer = 0;
      }
    }
  }

  getId(): string { return this.config.id; }
  getName(): string { return this.config.name; }
  getIcon(): string { return this.config.icon; }
  getDescription(): string { return this.config.description; }
  getUsesLeft(): number { return this.currentUses; }
  getCooldownPercent(): number {
    if (!this.isOnCooldown) return 0;
    return this.cooldownTimer / this.config.cooldown;
  }
  isAvailable(): boolean {
    return !this.isOnCooldown && this.currentUses > 0;
  }

  addUses(count: number): void {
    this.currentUses = Math.min(this.currentUses + count, this.config.maxUses);
  }
}
```

- [ ] **4.2 Create PropManager**

`src/props/PropManager.ts`:
```typescript
import { Prop, PropConfig } from './Prop';
import { Card } from '../game/Card';
import { Slot } from '../game/Slot';
import { Board } from '../game/Board';

export class PropManager {
  private props: Map<string, Prop> = new Map();
  private boostMultiplier: number = 1;

  constructor() {
    this.initializeProps();
  }

  private initializeProps(): void {
    const propConfigs: PropConfig[] = [
      {
        id: 'undo',
        name: '时光倒流',
        icon: '🌹',
        description: '撤销上一步',
        cooldown: 5,
        maxUses: 3,
      },
      {
        id: 'shuffle',
        name: '命运洗牌',
        icon: '🌸',
        description: '重新排列卡牌',
        cooldown: 10,
        maxUses: 2,
      },
      {
        id: 'moveOut',
        name: '移形换影',
        icon: '💕',
        description: '移出3张卡牌',
        cooldown: 15,
        maxUses: 1,
      },
      {
        id: 'hint',
        name: '灵犀一点',
        icon: '⭐',
        description: '提示可消除',
        cooldown: 8,
        maxUses: 3,
      },
    ];

    propConfigs.forEach(config => {
      this.props.set(config.id, new Prop(config));
    });
  }

  useProp(id: string, board: Board, slot: Slot, cards: Card[]): boolean {
    const prop = this.props.get(id);
    if (!prop || !prop.isAvailable()) return false;

    const used = prop.use();
    if (!used) return false;

    // Apply boost if active
    if (this.boostMultiplier > 1) {
      // Reduce cooldown
      // This would need access to the prop's internals
    }

    switch (id) {
      case 'undo':
        return this.undo(board, slot, cards);
      case 'shuffle':
        return this.shuffle(board);
      case 'moveOut':
        return this.moveOut(slot, cards);
      case 'hint':
        return this.hint(board);
      default:
        return false;
    }
  }

  private undo(board: Board, slot: Slot, cards: Card[]): boolean {
    // Undo logic - restore last card from slot to board
    // This is a simplified version
    return true;
  }

  private shuffle(board: Board): boolean {
    // Shuffle logic - regenerate board
    board.generate();
    return true;
  }

  private moveOut(slot: Slot, cards: Card[]): boolean {
    // Move out logic - remove 3 cards from slot
    // This would need to be implemented based on game logic
    return true;
  }

  private hint(board: Board): boolean {
    // Hint logic - highlight matching cards
    // This would need to be implemented based on game logic
    return true;
  }

  update(deltaTime: number): void {
    this.props.forEach(prop => prop.update(deltaTime));
  }

  setBoost(multiplier: number): void {
    this.boostMultiplier = multiplier;
  }

  getProps(): Prop[] {
    return Array.from(this.props.values());
  }

  getProp(id: string): Prop | undefined {
    return this.props.get(id);
  }
}
```

---

### Task 5: Integration

- [ ] **5.1 Update Game class to use easter eggs and props**

Add to `Game.ts`:
```typescript
import { EasterEggManager } from '../easter-eggs/EasterEggManager';
import { PropManager } from '../props/PropManager';
import { AudioManager } from '../audio/AudioManager';

// In Game class:
private easterEggManager: EasterEggManager;
private propManager: PropManager;
private audioManager: AudioManager;

constructor() {
  // ... existing code ...
  this.easterEggManager = new EasterEggManager();
  this.propManager = new PropManager();
  this.audioManager = AudioManager.getInstance();
}

// In checkMatches():
if (matching.length >= 3) {
  this.slot.removeCards(lastCard.type);
  this.score += 100;

  // Trigger easter egg
  this.easterEggManager.trigger(lastCard.type);

  // Play match sound
  this.audioManager.playSound('match');
}

// In update():
this.easterEggManager.update(deltaTime);
this.propManager.update(deltaTime);

// In render():
this.easterEggManager.render(ctx);
```

- [ ] **5.2 Add sound placeholders**

Create `assets/sounds/README.md`:
```markdown
# Sound Files

Place the following sound files in this directory:

- bgm.mp3 - Background music
- click.mp3 - Card click sound
- match.mp3 - Match sound
- firework.mp3 - Firework sound
- heart.mp3 - Heart rain sound
- rose.mp3 - Rose blessing sound
- level-complete.mp3 - Level complete sound
- game-over.mp3 - Game over sound
```

---

### Task 6: Testing

- [ ] **6.1 Test easter eggs**

1. Run the game
2. Match 3 heart cards - should trigger HeartRain
3. Match 3 kiss cards - should trigger KissFireworks
4. Match 3 rose cards - should trigger RoseBlessing
5. Verify effects display correctly
6. Verify audio plays (if sound files are added)

- [ ] **6.2 Test props**

1. Click on props in the UI
2. Verify cooldown works
3. Verify uses count decreases
4. Verify boost from RoseBlessing

- [ ] **6.3 Commit and verify**

```bash
cd /c/Users/fsycbi001/love-match
npm run build
git add .
git commit -m "feat: add easter eggs, effects, audio, and props system"
```

---

## Success Criteria

1. Easter eggs trigger when matching 3 special cards
2. Particle effects display correctly
3. Audio system works (when sound files are added)
4. Props can be used with cooldown
5. Game compiles and builds successfully
6. All effects are performant (60fps)
