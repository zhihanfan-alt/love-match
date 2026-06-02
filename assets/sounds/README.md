# Sound Assets

This directory contains audio files for the Love Match game.

## Required Files

| Filename | Description | Used In |
|----------|-------------|---------|
| `bgm.mp3` | Background music, looped during gameplay | `AudioManager.playBGM()` |
| `card-click.mp3` | Played when a card is tapped | `AudioManager.playSound('card-click')` |
| `match.mp3` | Played when 3 cards match and clear | `AudioManager.playSound('match')` |
| `combo.mp3` | Played on consecutive matches (combo streak) | `AudioManager.playSound('combo')` |
| `level-complete.mp3` | Fanfare when a level is cleared | `AudioManager.playSound('level-complete')` |
| `game-over.mp3` | Played when the slot fills up (game over) | `AudioManager.playSound('game-over')` |
| `easter-egg.mp3` | Played when an easter egg is triggered | `AudioManager.playSound('easter-egg')` |
| `button.mp3` | Generic UI button press feedback | `AudioManager.playSound('button')` |

## Format Guidelines

- **Format**: MP3 (best browser compatibility), OGG as fallback
- **Sample rate**: 44100 Hz
- **Bitrate**: 128 kbps (sufficient for short SFX)
- **BGM duration**: 30-60 seconds (looped seamlessly)
- **SFX duration**: 0.2 - 1.5 seconds
- **Normalize** all files to -1 dB to avoid clipping

## Integration

Load sounds in `main.ts` after user interaction (required by browsers for AudioContext):

```typescript
const audio = AudioManager.getInstance();
await audio.init();
await audio.loadSound('bgm', '/assets/sounds/bgm.mp3');
await audio.loadSound('card-click', '/assets/sounds/card-click.mp3');
// ... load remaining sounds
audio.playBGM('bgm');
```
