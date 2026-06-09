/**
 * Singleton audio manager using Web Audio API.
 * Handles loading, playing, and controlling all game sounds and background music.
 */
import { SoundGenerator } from './SoundGenerator';

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted: boolean = false;
  private soundGenerator: SoundGenerator | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init(): Promise<void> {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.soundGenerator = new SoundGenerator(this.audioContext);
    this.generateSounds();
  }

  private generateSounds(): void {
    if (!this.soundGenerator) return;

    this.sounds.set('click', this.soundGenerator.generateClick());
    this.sounds.set('match', this.soundGenerator.generateMatch());
    this.sounds.set('level-complete', this.soundGenerator.generateLevelComplete());
    this.sounds.set('game-over', this.soundGenerator.generateGameOver());
    this.sounds.set('easter-egg', this.soundGenerator.generateEasterEgg());
    this.sounds.set('bgm', this.soundGenerator.generateBGM());
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  playSound(name: string, volume: number = 1): void {
    if (!this.audioContext || this.isMuted) return;

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  playBGM(name: string, volume: number = 0.3): void {
    if (!this.audioContext || this.isMuted) return;

    this.stopBGM();

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    this.bgmSource = this.audioContext.createBufferSource();
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true;

    if (this.bgmGain) {
      this.bgmGain.gain.value = volume;
      this.bgmSource.connect(this.bgmGain);
    }

    this.bgmSource.start(0);
  }

  stopBGM(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (e) {
        // Ignore InvalidStateError if already stopped
      }
      this.bgmSource = null;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopBGM();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }
}
