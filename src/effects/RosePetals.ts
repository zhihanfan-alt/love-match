import { EmojiParticles } from './EmojiParticles';

export class RosePetals extends EmojiParticles {
  constructor(duration: number = 5) {
    super('🌹', {
      color: '#FF69B4',
    }, duration);
  }
}
