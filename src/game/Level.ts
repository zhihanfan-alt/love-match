import { LevelConfig, CardType } from '../types';

export class Level {
  private static levels: LevelConfig[] = [
    {
      id: 1,
      name: '心动',
      layers: 5,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 6,
      boardRows: 7,
      cardSize: 60,
      cardGap: 8,
      slotCount: 7,
      timeLimit: null,
      propUsesMultiplier: 1,
    },
    {
      id: 2,
      name: '情深',
      layers: 6,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 6,
      boardRows: 8,
      cardSize: 50,
      cardGap: 6,
      slotCount: 6,
      timeLimit: 240,
      propUsesMultiplier: 0.6,
    },
    {
      id: 3,
      name: '永恒',
      layers: 7,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 7,
      boardRows: 9,
      cardSize: 44,
      cardGap: 5,
      slotCount: 5,
      timeLimit: 180,
      propUsesMultiplier: 0.4,
    },
    {
      id: 4,
      name: '迷雾',
      layers: 8,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 8,
      boardRows: 10,
      cardSize: 40,
      cardGap: 4,
      slotCount: 4,
      timeLimit: 150,
      propUsesMultiplier: 0.3,
    },
    {
      id: 5,
      name: '深渊',
      layers: 9,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 9,
      boardRows: 11,
      cardSize: 36,
      cardGap: 4,
      slotCount: 4,
      timeLimit: 120,
      propUsesMultiplier: 0.2,
    },
    {
      id: 6,
      name: '绝恋',
      layers: 10,
      cardTypes: [
        CardType.Heart, CardType.Kiss, CardType.Rose, CardType.Begonia,
        CardType.Star, CardType.Moon, CardType.Gift, CardType.Gem,
      ],
      boardCols: 10,
      boardRows: 12,
      cardSize: 34,
      cardGap: 3,
      slotCount: 3,
      timeLimit: 120,
      propUsesMultiplier: 0.15,
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

  static getAllLevels(): LevelConfig[] {
    return this.levels;
  }
}
