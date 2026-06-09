import { Card } from './Card';
import { CardType } from '../types';
import { CANVAS_WIDTH } from '../constants';

export interface BoardConfig {
  layers: number;
  cardTypes: CardType[];
  boardCols: number;
  boardRows: number;
  cardSize: number;
  cardGap: number;
  boardStartY: number;
}

export class Board {
  private cards: Card[] = [];
  private config: BoardConfig;
  private sortedForHitTest: Card[] | null = null;
  private sortedForRender: Card[] | null = null;
  private needsSort: boolean = true;

  constructor(config: BoardConfig) {
    this.config = config;
  }

  generate(): void {
    this.cards = [];
    this.needsSort = true;
    let cardId = 0;
    const { layers, cardTypes, boardCols, boardRows, cardSize, cardGap, boardStartY } = this.config;

    for (let layer = 0; layer < layers; layer++) {
      const cols = boardCols - layer;
      const rows = boardRows - layer;
      if (cols <= 0 || rows <= 0) continue;

      const offsetX = (layer * (cardSize + cardGap)) / 2;
      const offsetY = (layer * (cardSize + cardGap)) / 2;

      const totalCards = cols * rows;
      const pairsNeeded = Math.floor(totalCards / 3) * 3;
      if (pairsNeeded === 0) continue;

      const typesForLayer = this.selectTypesForLayer(pairsNeeded, cardTypes);

      let cardIndex = 0;
      for (let row = 0; row < rows && cardIndex < pairsNeeded; row++) {
        for (let col = 0; col < cols && cardIndex < pairsNeeded; col++) {
          const x = offsetX + col * (cardSize + cardGap) + (CANVAS_WIDTH - cols * (cardSize + cardGap)) / 2;
          const y = boardStartY + offsetY + row * (cardSize + cardGap);

          const card = new Card(
            cardId++,
            typesForLayer[cardIndex],
            { x, y },
            layer,
            cardSize
          );

          this.cards.push(card);
          cardIndex++;
        }
      }
    }
  }

  private selectTypesForLayer(count: number, cardTypes: CardType[]): CardType[] {
    const numTypes = cardTypes.length;
    const totalTriplets = Math.floor(count / 3);
    const tripletsPerType = Math.floor(totalTriplets / numTypes);
    let extraTriplets = totalTriplets - tripletsPerType * numTypes;

    const types: CardType[] = [];
    for (const type of cardTypes) {
      let tripletCount = tripletsPerType;
      if (extraTriplets > 0) {
        tripletCount++;
        extraTriplets--;
      }
      for (let i = 0; i < tripletCount * 3; i++) {
        types.push(type);
      }
    }

    // Shuffle (Fisher-Yates)
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    return types.slice(0, count);
  }

  getCardAtPosition(x: number, y: number): Card | null {
    this.updateSortedArrays();
    if (!this.sortedForHitTest) return null;

    for (const card of this.sortedForHitTest) {
      if (card.containsPoint(x, y)) {
        if (this.isCardAccessible(card)) {
          return card;
        }
      }
    }

    return null;
  }

  private isCardAccessible(card: Card): boolean {
    const higherCards = this.cards.filter(
      c => !c.isRemoved && c.layer > card.layer
    );

    for (const higher of higherCards) {
      if (this.cardsOverlap(card, higher)) {
        return false;
      }
    }

    return true;
  }

  private cardsOverlap(a: Card, b: Card): boolean {
    const s = this.config.cardSize;
    return !(
      a.position.x + s < b.position.x ||
      b.position.x + s < a.position.x ||
      a.position.y + s < b.position.y ||
      b.position.y + s < a.position.y
    );
  }

  removeCard(card: Card): void {
    card.isRemoved = true;
    this.needsSort = true;
  }

  getCards(): Card[] {
    return this.cards.filter(c => !c.isRemoved);
  }

  getRemainingCount(): number {
    return this.cards.filter(c => !c.isRemoved).length;
  }

  getTotalCount(): number {
    return this.cards.length;
  }

  private updateSortedArrays(): void {
    if (!this.needsSort) return;

    const activeCards = this.cards.filter(c => !c.isRemoved);
    this.sortedForHitTest = [...activeCards].sort((a, b) => b.layer - a.layer);
    this.sortedForRender = [...activeCards].sort((a, b) => a.layer - b.layer);
    this.needsSort = false;
  }

  update(deltaTime: number): void {
    this.cards.forEach(card => card.update(deltaTime));
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.updateSortedArrays();
    this.sortedForRender?.forEach(card => card.render(ctx));
  }
}
