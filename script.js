const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextContext = nextCanvas.getContext("2d");
const startButton = document.getElementById("start");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");

const COLS = 10;
const ROWS = 20;
const BLOCK = canvas.width / COLS;

const COLORS = [
  "#000000",
  "#ff595e",
  "#ffca3a",
  "#8ac926",
  "#1982c4",
  "#6a4c93",
  "#ff924c",
  "#52b788",
];

const SHAPES = [
  [],
  [
    [1, 1, 1, 1],
  ],
  [
    [2, 0, 0],
    [2, 2, 2],
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
  ],
  [
    [4, 4],
    [4, 4],
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
  ],
  [
    [6, 6, 0],
    [0, 6, 6],
  ],
  [
    [0, 7, 0],
    [7, 7, 7],
  ],
];

let board = createBoard();
let currentPiece = null;
let nextPiece = null;
let dropCounter = 0;
let lastTime = 0;
let isRunning = false;
let level = 1;
let score = 0;
let lines = 0;
let dropInterval = 1000;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function resetGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;
  currentPiece = createPiece();
  nextPiece = createPiece();
  updateStats();
  draw();
}

function createPiece() {
  const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  const matrix = SHAPES[typeId].map((row) => row.slice());
  return {
    matrix,
    pos: {
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    },
  };
}

function drawBlock(ctx, x, y, value) {
  ctx.fillStyle = COLORS[value];
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK - 1, BLOCK - 1);
}

function drawBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(context, x, y, value);
      }
    });
  });
}

function drawPiece(piece, ctx = context) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(ctx, piece.pos.x + x, piece.pos.y + y, value);
      }
    });
  });
}

function drawNext() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPiece) return;
  const temp = {
    matrix: nextPiece.matrix,
    pos: {
      x: 1,
      y: 1,
    },
  };
  temp.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(nextContext, temp.pos.x + x, temp.pos.y + y, value);
      }
    });
  });
}

function draw() {
  drawBoard();
  if (currentPiece) {
    drawPiece(currentPiece);
  }
  drawNext();
}

function collide(boardState, piece) {
  return piece.matrix.some((row, y) => {
    return row.some((value, x) => {
      if (value === 0) return false;
      const newY = piece.pos.y + y;
      const newX = piece.pos.x + x;
      return (
        newY >= ROWS ||
        newX < 0 ||
        newX >= COLS ||
        (boardState[newY] && boardState[newY][newX] !== 0)
      );
    });
  });
}

function merge(boardState, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        boardState[piece.pos.y + y][piece.pos.x + x] = value;
      }
    });
  });
}

function rotate(matrix) {
  const result = matrix.map((row) => row.slice());
  for (let y = 0; y < result.length; y += 1) {
    for (let x = 0; x < y; x += 1) {
      [result[x][y], result[y][x]] = [result[y][x], result[x][y]];
    }
  }
  result.forEach((row) => row.reverse());
  return result;
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((value) => value !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared > 0) {
    const lineScore = [0, 40, 100, 300, 1200];
    score += lineScore[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(200, 1000 - (level - 1) * 80);
  }
}

function updateStats() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function playerDrop() {
  currentPiece.pos.y += 1;
  if (collide(board, currentPiece)) {
    currentPiece.pos.y -= 1;
    merge(board, currentPiece);
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    if (collide(board, currentPiece)) {
      isRunning = false;
    }
  }
  updateStats();
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(board, currentPiece)) {
    currentPiece.pos.y += 1;
  }
  currentPiece.pos.y -= 1;
  merge(board, currentPiece);
  clearLines();
  currentPiece = nextPiece;
  nextPiece = createPiece();
  if (collide(board, currentPiece)) {
    isRunning = false;
  }
  updateStats();
}

function movePiece(dir) {
  currentPiece.pos.x += dir;
  if (collide(board, currentPiece)) {
    currentPiece.pos.x -= dir;
  }
}

function rotatePiece() {
  const original = currentPiece.matrix;
  const rotated = rotate(original);
  currentPiece.matrix = rotated;
  if (collide(board, currentPiece)) {
    currentPiece.matrix = original;
  }
}

function update(time = 0) {
  if (!isRunning) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

startButton.addEventListener("click", () => {
  isRunning = true;
  resetGame();
  lastTime = 0;
  dropCounter = 0;
  requestAnimationFrame(update);
});

window.addEventListener("keydown", (event) => {
  if (!isRunning) return;
  switch (event.key) {
    case "ArrowLeft":
      movePiece(-1);
      break;
    case "ArrowRight":
      movePiece(1);
      break;
    case "ArrowDown":
      playerDrop();
      break;
    case "ArrowUp":
      rotatePiece();
      break;
    case " ":
      hardDrop();
      break;
    default:
      break;
  }
  draw();
});

resetGame();
