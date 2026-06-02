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
