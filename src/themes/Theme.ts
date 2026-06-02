export interface Theme {
  id: string;
  name: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    text: string;
    textWhite: string;
    slotBg: string;
    border: string;
  };
  cardStyles: {
    heart: string;
    kiss: string;
    rose: string;
    begonia: string;
    star: string;
    moon: string;
    gift: string;
    gem: string;
  };
}
