import { Card } from './Card';
import { CardType } from '../types';
import { BOARD_COLS, BOARD_ROWS, CARD_SIZE, CARD_GAP, BOARD_START_Y, CANVAS_WIDTH } from '../constants';

export class Board {
  private cards: Card[] = [];
  private layers: number;
  private cardTypes: CardType[];

  constructor(layers: number, cardTypes: CardType[]) {
    this.layers = layers;
    this.cardTypes = cardTypes;
  }

  generate(): void {
    this.cards = [];
    let cardId = 0;

    for (let layer = 0; layer < this.layers; layer++) {
      const cols = BOARD_COLS - layer;
      const rows = BOARD_ROWS - layer;
      const offsetX = (layer * (CARD_SIZE + CARD_GAP)) / 2;
      const offsetY = (layer * (CARD_SIZE + CARD_GAP)) / 2;

      // Generate pairs for this layer
      const totalCards = cols * rows;
      const pairsNeeded = Math.floor(totalCards / 3) * 3;
      const typesForLayer = this.selectTypesForLayer(pairsNeeded);

      let cardIndex = 0;
      for (let row = 0; row < rows && cardIndex < pairsNeeded; row++) {
        for (let col = 0; col < cols && cardIndex < pairsNeeded; col++) {
          const x = offsetX + col * (CARD_SIZE + CARD_GAP) + (CANVAS_WIDTH - cols * (CARD_SIZE + CARD_GAP)) / 2;
          const y = BOARD_START_Y + offsetY + row * (CARD_SIZE + CARD_GAP);

          const card = new Card(
            cardId++,
            typesForLayer[cardIndex],
            { x, y },
            layer
          );

          this.cards.push(card);
          cardIndex++;
        }
      }
    }
  }

  private selectTypesForLayer(count: number): CardType[] {
    const types: CardType[] = [];
    const availableTypes = [...this.cardTypes];

    while (types.length < count) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      types.push(type, type, type); // Always add 3 of same type
    }

    // Shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    return types.slice(0, count);
  }

  getCardAtPosition(x: number, y: number): Card | null {
    // Check from top layer to bottom
    const sortedCards = [...this.cards].sort((a, b) => b.layer - a.layer);

    for (const card of sortedCards) {
      if (!card.isRemoved && card.containsPoint(x, y)) {
        // Check if card is accessible (not covered by others)
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
    return !(
      a.position.x + CARD_SIZE < b.position.x ||
      b.position.x + CARD_SIZE < a.position.x ||
      a.position.y + CARD_SIZE < b.position.y ||
      b.position.y + CARD_SIZE < a.position.y
    );
  }

  removeCard(card: Card): void {
    card.isRemoved = true;
  }

  getCards(): Card[] {
    return this.cards.filter(c => !c.isRemoved);
  }

  update(deltaTime: number): void {
    this.cards.forEach(card => card.update(deltaTime));
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render from bottom layer to top
    const sortedCards = [...this.cards].sort((a, b) => a.layer - b.layer);
    sortedCards.forEach(card => card.render(ctx));
  }
}
