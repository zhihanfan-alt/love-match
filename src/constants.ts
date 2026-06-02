import { CardType } from "./types";

// Canvas dimensions (iPhone Pro-ish ratio)
export const CANVAS_WIDTH = 430;
export const CANVAS_HEIGHT = 932;

// Board card dimensions
export const CARD_SIZE = 60;
export const CARD_GAP = 8;
export const CARD_RADIUS = 12;

// Slot (bottom bar) dimensions
export const SLOT_COUNT = 7;
export const SLOT_HEIGHT = 80;
export const SLOT_CARD_SIZE = 50;

// Board layout
export const BOARD_COLS = 7;
export const BOARD_ROWS = 8;
export const BOARD_START_Y = 200;

// Theme colours – romantic / cute palette
export const COLORS = {
  // Backgrounds
  bgGradientStart: "#FFB7C5",
  bgGradientEnd: "#DDA0DD",
  cardBg: "#FFFFFF",
  cardBgRevealed: "#FFF0F5",
  slotBg: "rgba(255, 255, 255, 0.3)",
  slotActive: "rgba(255, 105, 180, 0.4)",

  // Card type accent colours
  heart: "#FF4D6A",
  kiss: "#FF69B4",
  rose: "#E84057",
  begonia: "#FF6B81",
  star: "#FFD700",
  moon: "#C0A0FF",
  gift: "#FF85A2",
  gem: "#7EC8E3",

  // Text
  textPrimary: "#D63384",
  textWhite: "#FFFFFF",
  textDark: "#4A2040",

  // UI
  buttonPrimary: "#FF69B4",
  buttonHover: "#FF85C8",
  shadow: "rgba(214, 51, 132, 0.25)",
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
