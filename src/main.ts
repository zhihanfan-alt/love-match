import { Game } from './game/Game';
import { GameState } from './types';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Handle menu click
canvas.addEventListener('click', () => {
  if (game.getState() === GameState.Menu) {
    game.startLevel(1);
  }
});

// Game loop
function gameLoop(timestamp: number): void {
  game.update(timestamp);
  game.render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
