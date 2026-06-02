import { Theme } from './Theme';

export const DefaultTheme: Theme = {
  id: 'default',
  name: '极光之夜',
  icon: '🌌',
  colors: {
    primary: '#0a1628',
    secondary: '#1a2a4a',
    accent: 'rgba(100, 200, 255, 0.8)',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    text: '#e2e8f0',
    textWhite: '#ffffff',
    slotBg: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(100, 200, 255, 0.6)',
  },
  cardStyles: {
    heart: '💕',
    kiss: '😘',
    rose: '🌹',
    begonia: '🌸',
    star: '⭐',
    moon: '🌙',
    gift: '🎁',
    gem: '💎',
  },
};
