import { Game } from './game/Game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Game loop
function gameLoop(timestamp: number): void {
  game.update(timestamp);
  game.render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
