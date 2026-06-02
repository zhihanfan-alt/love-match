import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "./constants";
import { GameState } from "./types";

// Bootstrap the game canvas
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Set logical size to match constants
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameState: GameState = GameState.Menu;

function render() {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.bgGradientStart);
  gradient.addColorStop(1, COLORS.bgGradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Placeholder title text
  ctx.fillStyle = COLORS.textWhite;
  ctx.font = "bold 36px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Love Match", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = "18px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("Tap to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

render();

console.log(`Game state: ${gameState}`);
