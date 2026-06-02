/**
 * Programmatic sound effects generator using Web Audio API.
 * Generates audio buffers for all game sounds without external files.
 */
export class SoundGenerator {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  generateClick(): AudioBuffer {
    const duration = 0.1;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + 400 * Math.exp(-t * 20);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.3;
    }

    return buffer;
  }

  generateMatch(): AudioBuffer {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq1 = 523.25;
      const freq2 = 659.25;
      const freq3 = 783.99;
      let sample = 0;

      if (t < 0.1) {
        sample = Math.sin(2 * Math.PI * freq1 * t) * (1 - t / 0.1);
      } else if (t < 0.2) {
        sample = Math.sin(2 * Math.PI * freq2 * (t - 0.1)) * (1 - (t - 0.1) / 0.1);
      } else {
        sample = Math.sin(2 * Math.PI * freq3 * (t - 0.2)) * (1 - (t - 0.2) / 0.1);
      }

      data[i] = sample * 0.3;
    }

    return buffer;
  }

  generateLevelComplete(): AudioBuffer {
    const duration = 1.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const noteDuration = 0.2;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration);
      const noteT = t % noteDuration;

      if (noteIndex < notes.length) {
        const freq = notes[noteIndex];
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-noteT * 10) * 0.3;
      }
    }

    return buffer;
  }

  generateGameOver(): AudioBuffer {
    const duration = 0.8;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 400 - 200 * t;
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.3;
    }

    return buffer;
  }

  generateEasterEgg(): AudioBuffer {
    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + 400 * Math.sin(t * 10);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.2;
    }

    return buffer;
  }

  generateBGM(): AudioBuffer {
    const duration = 30;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const notes = [
      { freq: 261.63, start: 0, duration: 0.5 },
      { freq: 329.63, start: 0.5, duration: 0.5 },
      { freq: 392.00, start: 1.0, duration: 0.5 },
      { freq: 523.25, start: 1.5, duration: 0.5 },
    ];

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        const noteT = t % 2;
        if (noteT >= note.start && noteT < note.start + note.duration) {
          const localT = noteT - note.start;
          sample += Math.sin(2 * Math.PI * note.freq * t) *
                   Math.exp(-localT * 5) * 0.1;
        }
      }

      left[i] = sample;
      right[i] = sample;
    }

    return buffer;
  }
}
