import { LevelConfig, CardType } from '../types';

export class Level {
  private static levels: LevelConfig[] = [
    {
      id: 1,
      layers: 2,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Star],
      cardsPerType: 3,
      name: '初遇',
    },
    {
      id: 2,
      layers: 3,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star],
      cardsPerType: 3,
      name: '心动',
    },
    {
      id: 3,
      layers: 3,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star, CardType.Moon],
      cardsPerType: 3,
      name: '浪漫',
    },
    {
      id: 4,
      layers: 4,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star, CardType.Moon, CardType.Gift],
      cardsPerType: 3,
      name: '甜蜜',
    },
    {
      id: 5,
      layers: 4,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem],
      cardsPerType: 3,
      name: '永恒',
    },
    {
      id: 6,
      layers: 5,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem],
      cardsPerType: 3,
      name: '挑战',
    },
    {
      id: 7,
      layers: 5,
      cardTypes: [CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia, CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem],
      cardsPerType: 3,
      name: '极限',
    },
  ];

  static getLevel(levelId: number): LevelConfig {
    return this.levels.find(l => l.id === levelId) || this.levels[0];
  }

  static getTotalLevels(): number {
    return this.levels.length;
  }

  static getLevelName(levelId: number): string {
    return this.getLevel(levelId).name;
  }
}
