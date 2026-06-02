// 2D position on canvas
export interface Position {
  x: number;
  y: number;
}

// Card type identifiers for the romantic theme
export enum CardType {
  Heart = "Heart",
  Kiss = "Kiss",
  Rose = "Rose",
  Begonia = "Begonia",
  Star = "Star",
  Moon = "Moon",
  Gift = "Gift",
  Gem = "Gem",
}

// Single card on the board
export interface CardData {
  id: number;
  type: CardType;
  position: Position;
  layer: number;
  isRevealed: boolean;
  isRemoved: boolean;
}

// Item in the bottom matching slot
export interface SlotItem {
  card: CardData;
  position: Position;
}

// Game flow states
export enum GameState {
  Menu = "Menu",
  Playing = "Playing",
  Paused = "Paused",
  GameOver = "GameOver",
  LevelComplete = "LevelComplete",
}

// Level configuration
export interface LevelConfig {
  id: number;
  name: string;
  layers: number;
  cardTypes: CardType[];
  cardsPerType: number;
}
