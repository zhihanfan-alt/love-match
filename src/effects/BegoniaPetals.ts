import { EmojiParticles } from './EmojiParticles';

export class BegoniaPetals extends EmojiParticles {
  constructor(duration: number = 5) {
    super('🌸', {
      color: '#FF4D6D',
    }, duration);
  }
}
