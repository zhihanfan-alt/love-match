import { EmojiParticles } from './EmojiParticles';

export class Hearts extends EmojiParticles {
  constructor(duration: number = 5) {
    super('💕', {
      color: '#FF69B4',
      gravity: 0.02,
    }, duration, 0.1);
  }
}
