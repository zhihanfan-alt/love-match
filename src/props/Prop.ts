/**
 * Prop - Base prop class with cooldown and usage tracking
 * Each prop has a limited number of uses and a cooldown between uses.
 */

export interface PropConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number;   // seconds
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

  /**
   * Attempt to use the prop.
   * Returns true if the prop was consumed, false if on cooldown or no uses left.
   */
  use(): boolean {
    if (this.isOnCooldown || this.currentUses <= 0) return false;

    this.currentUses--;
    this.isOnCooldown = true;
    this.cooldownTimer = this.config.cooldown;
    return true;
  }

  /**
   * Update cooldown timer. Call once per frame with deltaTime in seconds.
   * boostMultiplier > 1 makes cooldowns expire faster.
   */
  update(deltaTime: number, boostMultiplier: number = 1): void {
    if (this.isOnCooldown) {
      this.cooldownTimer -= deltaTime * boostMultiplier;
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
  getMaxUses(): number { return this.config.maxUses; }

  /** Returns cooldown progress as 0..1 (1 = just started, 0 = ready) */
  getCooldownPercent(): number {
    if (!this.isOnCooldown || this.config.cooldown === 0) return 0;
    return this.cooldownTimer / this.config.cooldown;
  }

  /** Returns true when the prop can be used right now */
  isAvailable(): boolean {
    return !this.isOnCooldown && this.currentUses > 0;
  }

  /** Add uses up to maxUses */
  addUses(count: number): void {
    if (count <= 0) return;
    this.currentUses = Math.min(this.currentUses + count, this.config.maxUses);
  }
}
