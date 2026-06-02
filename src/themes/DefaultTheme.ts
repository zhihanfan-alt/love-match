import { Theme } from './Theme';

export const DefaultTheme: Theme = {
  id: 'default',
  name: '浪漫粉',
  icon: '💕',
  colors: {
    primary: '#FFB7C5',
    secondary: '#DDA0DD',
    accent: '#FF69B4',
    background: 'linear-gradient(135deg, #FFB7C5 0%, #DDA0DD 100%)',
    cardBg: '#FFFFFF',
    text: '#333333',
    textWhite: '#FFFFFF',
    slotBg: 'rgba(255,255,255,0.3)',
    border: '#FF69B4',
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
