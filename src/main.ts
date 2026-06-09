import { Game } from './game/Game';
import { gsap } from './animation/GSAPAnimations';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Use GSAP's ticker for the game loop — handles pause on tab blur, lag smoothing
gsap.ticker.add(() => {
  const timestamp = performance.now();
  game.update(timestamp);
  game.render();
});

(window as unknown as Record<string, unknown>).__loveMatchDestroy = () => {
  gsap.ticker.remove(game.update);
  game.destroy();
};
