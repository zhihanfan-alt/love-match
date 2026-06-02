import { CardType } from "./types";

// Canvas dimensions (iPhone Pro-ish ratio)
export const CANVAS_WIDTH = 430;
export const CANVAS_HEIGHT = 932;

// Animation
export const ANIMATION_SPEED = 3;

// Board card dimensions
export const CARD_SIZE = 60;
export const CARD_GAP = 8;
export const CARD_RADIUS = 12;

// Slot (bottom bar) dimensions
export const SLOT_COUNT = 7;
export const SLOT_HEIGHT = 80;
export const SLOT_CARD_SIZE = 50;

// Board layout
export const BOARD_COLS = 6;
export const BOARD_ROWS = 7;
export const BOARD_START_Y = 200;

// Theme colours – Arctic Aurora palette
export const COLORS = {
  // Backgrounds
  bgGradientStart: "#0a1628",
  bgGradientEnd: "#1a2a4a",
  cardBg: "rgba(255, 255, 255, 0.9)",
  cardBgRevealed: "rgba(255, 255, 255, 0.95)",
  slotBg: "rgba(255, 255, 255, 0.15)",
  slotActive: "rgba(100, 200, 255, 0.3)",

  // Card type accent colours - Aurora colors
  heart: "#ff6b9d",
  kiss: "#c084fc",
  rose: "#f472b6",
  begonia: "#fb923c",
  star: "#fbbf24",
  moon: "#818cf8",
  gift: "#34d399",
  gem: "#22d3ee",

  // Text
  textPrimary: "#e2e8f0",
  textWhite: "#ffffff",
  textDark: "#1e293b",

  // UI
  buttonPrimary: "rgba(100, 200, 255, 0.6)",
  buttonHover: "rgba(100, 200, 255, 0.8)",
  shadow: "rgba(0, 0, 0, 0.3)",
  cardShadow: "rgba(0, 0, 0, 0.2)",
  accent: "rgba(100, 200, 255, 0.8)",
} as const;

// All available card types (8 total)
export const CARD_TYPES: CardType[] = [
  CardType.Heart,
  CardType.Kiss,
  CardType.Rose,
  CardType.Begonia,
  CardType.Star,
  CardType.Moon,
  CardType.Gift,
  CardType.Gem,
];

// Emoji mapping for each card type
export const CARD_EMOJIS: Record<CardType, string> = {
  [CardType.Heart]: "❤️",
  [CardType.Kiss]: "💋",
  [CardType.Rose]: "🌹",
  [CardType.Begonia]: "🌺",
  [CardType.Star]: "⭐",
  [CardType.Moon]: "🌙",
  [CardType.Gift]: "🎁",
  [CardType.Gem]: "💎",
};
