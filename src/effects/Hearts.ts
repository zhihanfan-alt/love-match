import { EmojiParticles } from './EmojiParticles';

export class Hearts extends EmojiParticles {
  constructor(duration: number = 5, spawnRate: number = 0.1) {
    super('💕', {
      color: '#FF69B4',
      gravity: 0.02,
    }, duration, spawnRate);
  }
}
