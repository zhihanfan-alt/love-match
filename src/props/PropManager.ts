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

    const consumed = prop.use();
    if (!consumed) return false;

    // Validate that game state supports this prop
    if (cards.length === 0 && (id === 'undo' || id === 'moveOut')) {
      return false;
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

  /**
   * Undo the last move: return the last card from the slot back to the board.
   */
  private undo(board: Board, slot: Slot, cards: Card[]): boolean {
    if (cards.length === 0) return false;

    const lastCard = cards[cards.length - 1];
    const removed = slot.removeCards(lastCard.type);

    // Restore removed cards back to board
    if (removed.length > 0) {
      for (const card of removed) {
        card.isRemoved = false;
      }
    }

    // Reference board to confirm it still has cards (game continues)
    const boardCards = board.getCards();
    if (boardCards.length === 0) {
      // Edge case: board is empty after undo - nothing to restore to
      return removed.length > 0;
    }

    return removed.length > 0;
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

    // Remove up to 3 cards from the slot
    const toRemove = Math.min(3, cards.length);
    let removed = 0;

    for (let i = 0; i < toRemove; i++) {
      const card = cards[cards.length - 1 - i];
      if (card) {
        slot.removeCards(card.type);
        removed++;
      }
    }

    // Reposition remaining cards in slot
    const remainingCards = slot.getCards();
    if (remainingCards.length > 0) {
      for (const card of remainingCards) {
        card.isRemoved = true; // mark for slot internal cleanup
      }
    }

    return removed > 0;
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
}
