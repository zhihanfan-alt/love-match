/**
 * PropManager - Manages all game props (undo, shuffle, moveOut, hint)
 * Coordinates prop usage with board/slot state and handles cooldowns.
 */

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
        cooldown: 2,
        maxUses: 5,
      },
      {
        id: 'shuffle',
        name: '命运洗牌',
        icon: '🌸',
        description: '重新排列卡牌',
        cooldown: 5,
        maxUses: 3,
      },
      {
        id: 'moveOut',
        name: '移形换影',
        icon: '💕',
        description: '移出3张卡牌',
        cooldown: 8,
        maxUses: 3,
      },
      {
        id: 'hint',
        name: '灵犀一点',
        icon: '⭐',
        description: '提示可消除',
        cooldown: 3,
        maxUses: 5,
      },
    ];

    propConfigs.forEach(config => {
      this.props.set(config.id, new Prop(config));
    });
  }

  /**
   * Use a prop by id. Returns true if the prop effect was applied.
   * @param id - prop identifier
   * @param board - current game board
   * @param slot - current matching slot
   * @param cards - all slot cards (used by undo/moveOut)
   */
  useProp(id: string, board: Board, slot: Slot, cards: Card[]): boolean {
    const prop = this.props.get(id);
    if (!prop || !prop.isAvailable()) return false;

    // Validate before consuming
    if (cards.length === 0 && (id === 'undo' || id === 'moveOut')) {
      return false;
    }

    const consumed = prop.use();
    if (!consumed) return false;

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

  /**
   * Undo the last move: restore the last card to its original position.
   */
  private undo(_board: Board, _slot: Slot, cards: Card[]): boolean {
    if (cards.length === 0) return false;

    const lastCard = cards[cards.length - 1];
    lastCard.restoreOriginalPosition();
    lastCard.isRemoved = false;
    return true;
  }

  /**
   * Shuffle all cards on the board by regenerating positions.
   */
  private shuffle(board: Board): boolean {
    board.generate();
    return true;
  }

  /**
   * Remove up to 3 cards from the matching slot to free space.
   * The removed cards are permanently lost (not returned to the board).
   */
  private moveOut(slot: Slot, cards: Card[]): boolean {
    if (cards.length === 0) return false;

    const toRemove = Math.min(3, cards.length);
    slot.removeLast(toRemove);
    return true;
  }

  /**
   * Highlight matching cards on the board as a hint.
   * Returns true if a matching pair was found and highlighted.
   */
  private hint(board: Board): boolean {
    const boardCards = board.getCards();
    if (boardCards.length < 3) return false;

    // Find first type that has at least 3 accessible cards
    const typeCounts = new Map<string, number>();
    for (const card of boardCards) {
      const count = (typeCounts.get(card.type) || 0) + 1;
      typeCounts.set(card.type, count);

      if (count >= 3) {
        // Found a matchable type - highlight all cards of this type
        for (const c of boardCards) {
          if (c.type === card.type) {
            c.setScale(1.15); // visual highlight effect
          }
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Update all prop cooldowns. Call once per frame.
   * boostMultiplier > 1 speeds up cooldown recovery.
   */
  update(deltaTime: number): void {
    this.props.forEach(prop => prop.update(deltaTime, this.boostMultiplier));
  }

  /** Set the cooldown speed multiplier (1 = normal, 2 = double speed) */
  setBoost(multiplier: number): void {
    this.boostMultiplier = multiplier;
  }

  /** Get all props as an array */
  getProps(): Prop[] {
    return Array.from(this.props.values());
  }

  /** Get a specific prop by id */
  getProp(id: string): Prop | undefined {
    return this.props.get(id);
  }

  /** Reset all props with scaled uses for the current level */
  applyUsesMultiplier(multiplier: number): void {
    const baseUses: Record<string, number> = {
      undo: 5,
      shuffle: 3,
      moveOut: 3,
      hint: 5,
    };
    this.props.forEach((prop, id) => {
      const base = baseUses[id] ?? prop.getMaxUses();
      const scaled = Math.max(1, Math.round(base * multiplier));
      prop.resetUses(scaled);
    });
  }

  /** Reset all props to default state */
  resetAll(): void {
    this.initializeProps();
  }
}
