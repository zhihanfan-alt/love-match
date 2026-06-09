import { EasterEgg } from './EasterEgg';
import { HeartRain } from './HeartRain';
import { KissFireworks } from './KissFireworks';
import { RoseBlessing } from './RoseBlessing';
import { CardType } from '../types';
import { AudioManager } from '../audio/AudioManager';

export class EasterEggManager {
  private easterEggs: Map<CardType, EasterEgg> = new Map();
  private activeEasterEgg: EasterEgg | null = null;
  private cooldownRemaining: number = 0;
  private static readonly COOLDOWN = 15;
  private static readonly BASE_CHANCE = 0.2;

  constructor() {
    this.register(new HeartRain());
    this.register(new KissFireworks());
    this.register(new RoseBlessing());
  }

  private register(easterEgg: EasterEgg): void {
    this.easterEggs.set(easterEgg.triggerType, easterEgg);
  }

  trigger(type: CardType, combo: number = 1): boolean {
    const easterEgg = this.easterEggs.get(type);
    if (!easterEgg || this.activeEasterEgg || this.cooldownRemaining > 0) return false;

    // Probability: base 20%, combo 3+ → 35%, combo 5+ → 50%
    let chance = EasterEggManager.BASE_CHANCE;
    if (combo >= 5) chance = 0.5;
    else if (combo >= 3) chance = 0.35;

    if (Math.random() > chance) return false;

    easterEgg.activate();
    this.activeEasterEgg = easterEgg;
    this.cooldownRemaining = EasterEggManager.COOLDOWN;
    AudioManager.getInstance().playSound('easter-egg');
    return true;
  }

  update(deltaTime: number): boolean {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= deltaTime;
    }

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
    if (this.activeEasterEgg?.getBoost) {
      return this.activeEasterEgg.getBoost();
    }
    return 1;
  }
}
