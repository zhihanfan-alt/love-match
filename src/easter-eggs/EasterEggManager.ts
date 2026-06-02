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
    if (this.activeEasterEgg?.getBoost) {
      return this.activeEasterEgg.getBoost();
    }
    return 1;
  }
}
