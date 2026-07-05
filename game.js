/* ============================
   強化版テトリス 全部入り game.js
   ============================ */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");

let board = createMatrix(COLS, ROWS);

let currentPiece = null;
let nextBag = [];
let nextPiece = null;

let holdPiece = null;
let holdUsed = false;

let score = 0;
let lines = 0;
let level = 1;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

let gameOver = false;

/* ============================
   テトリミノ定義
   ============================ */

const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#00f0f0"
  },
  O: {
    shape: [
      [2, 2],
      [2, 2]
    ],
    color: "#f0f000"
  },
  T: {
    shape: [
      [0, 3, 0],
      [3, 3, 3],
      [0, 0, 0]
    ],
    color: "#a000f0"
  },
  S: {
    shape: [
      [0, 4, 4],
      [4, 4, 0],
      [0, 0, 0]
    ],
    color: "#00f000"
  },
  Z: {
    shape: [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0]
    ],
    color: "#f00000"
  },
  J: {
    shape: [
      [6, 0, 0],
      [6, 6, 6],
      [0, 0, 0]
    ],
    color: "#0000f0"
  },
  L: {
    shape: [
      [0, 0, 7],
      [7, 7, 7],
      [0, 0, 0]
    ],
    color: "#f0a000"
  }
};

const T_KEYS = Object.keys(TETROMINOS);

/* ============================
   ユーティリティ
   ============================ */

function createMatrix(cols, rows) {
  const matrix = [];
  for (let y = 0; y < rows; y++) {
    matrix.push(new Array(cols).fill(0));
  }
  return matrix;
}

function drawCell(x, y, value, context, size) {
  if (value === 0) return;
  context.fillStyle = getColor(value);
  context.fillRect(x * size, y * size, size, size);
  context.strokeStyle = "#111";
  context.strokeRect(x * size, y * size, size, size);
}

function getColor(value) {
  switch (value) {
    case 1: return TETROMINOS.I.color;
    case 2: return TETROMINOS.O.color;
    case 3: return TETROMINOS.T.color;
    case 4: return TETROMINOS.S.color;
    case 5: return TETROMINOS.Z.color;
    case 6: return TETROMINOS.J.color;
    case 7: return TETROMINOS.L.color;
    default: return "#fff";
  }
}

/* ============================
   7バッグランダム
   ============================ */

function generateBag() {
  const bag = [...T_KEYS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function getNextPiece() {
  if (nextBag.length === 0) {
    nextBag = generateBag();
  }
  const key = nextBag.pop();
  const tet = TETROMINOS[key];
  const shape = tet.shape.map(row => row.slice());
  const id = T_KEYS.indexOf(key) + 1;

  const piece = {
    shape: shape.map(row => row.map(v => (v ? id : 0))),
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0
  };
  return piece;
}

/* ============================
   ゴーストブロック
   ============================ */

function getGhostPiece(piece) {
  const ghost = JSON.parse(JSON.stringify(piece));
  while (!collides(board, { ...ghost, y: ghost.y + 1 })) {
    ghost.y++;
  }
  return ghost;
}

/* ============================
   描画
   ============================ */

function clearBoard() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
  clearBoard();

  // 既存ブロック
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      drawCell(x, y, board[y][x], ctx, BLOCK_SIZE);
    }
  }

  // ゴーストブロック
  const ghost = getGhostPiece(currentPiece);
  ghost.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect((ghost.x + x) * BLOCK_SIZE, (ghost.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });

  // 現在のブロック
  drawPiece(currentPiece, ctx, BLOCK_SIZE);
}

function drawPiece(piece, context, size) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawCell(piece.x + x, piece.y + y, value, context, size);
      }
    });
  });
}

function drawNextPiece() {
  nextCtx.fillStyle = "#000";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  const size = 16;
  const offsetX = 1;
  const offsetY = 1;

  nextPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawCell(offsetX + x, offsetY + y, value, nextCtx, size);
      }
    });
  });
}

function drawHoldPiece() {
  holdCtx.fillStyle = "#000";
  holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

  if (!holdPiece) return;

  const size = 16;
  const offsetX = 1;
  const offsetY = 1;

  holdPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawCell(offsetX + x, offsetY + y, value, holdCtx, size);
      }
    });
  });
}

/* ============================
   衝突判定
   ============================ */

function collides(board, piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) {
        const bx = piece.x + x;
        const by = piece.y + y;
        if (bx < 0 || bx >= COLS || by >= ROWS) {
          return true;
        }
        if (by >= 0 && board[by][bx] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

/* ============================
   ピース固定 & ライン消去
   ============================ */

function merge(board, piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const by = piece.y + y;
        const bx = piece.x + x;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board[by][bx] = value;
        }
      }
    });
  });
}

function sweepLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(value => value !== 0)) {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(0));
      linesCleared++;
      y++;
    }
  }

  if (linesCleared > 0) {
    lines += linesCleared;
    const points = [0, 40, 100, 300, 1200][linesCleared];
    score += points * level;
    level = 1 + Math.floor(lines / 10);
    dropInterval = Math.max(150, 1000 - (level - 1) * 80);
    updateScorePanel();
  }
}

function updateScorePanel() {
  document.getElementById("score").textContent = score;
  document.getElementById("lines").textContent = lines;
  document.getElementById("level").textContent = level;
}

/* ============================
   回転
   ============================ */

function rotate(piece) {
  const rotated = piece.shape.map((row, y) =>
    row.map((_, x) => piece.shape[piece.shape.length - 1 - x][y])
  );
  const oldShape = piece.shape;
  piece.shape = rotated;
  if (collides(board, piece)) {
    piece.shape = oldShape;
  }
}

/* ============================
   落下処理
   ============================ */

function drop() {
  if (gameOver) return;
  currentPiece.y++;
  if (collides(board, currentPiece)) {
    currentPiece.y--;
    merge(board, currentPiece);
    sweepLines();
    spawnPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  if (gameOver) return;
  while (!collides(board, { ...currentPiece, y: currentPiece.y + 1 })) {
    currentPiece.y++;
  }
  merge(board, currentPiece);
  sweepLines();
  spawnPiece();
  dropCounter = 0;
}

/* ============================
   ホールド機能
   ============================ */

function hold() {
  if (holdUsed) return;

  if (!holdPiece) {
    holdPiece = currentPiece;
    spawnPiece();
  } else {
    const temp = currentPiece;
    currentPiece = holdPiece;
    holdPiece = temp;
    currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.shape[0].length / 2);
    currentPiece.y = 0;
  }

  holdUsed = true;
  drawHoldPiece();
}

/* ============================
   ピース生成
   ============================ */

function spawnPiece() {
  currentPiece = nextPiece || getNextPiece();
  nextPiece = getNextPiece();
  holdUsed = false;

  drawNextPiece();

  if (collides(board, currentPiece)) {
    gameOver = true;
    endGame();
  }
}

/* ============================
   ゲームオーバー
   ============================ */

function endGame() {
  document.getElementById("final-score").textContent = `スコア: ${score}`;
  document.getElementById("game-over").classList.remove("hidden");
}

/* ============================
   メインループ
   ============================ */

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (!gameOver && dropCounter > dropInterval) {
    drop();
  }

  drawBoard();
  requestAnimationFrame(update);
}

/* ============================
   キーボード操作
   ============================ */

document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  switch (e.key) {
    case "ArrowLeft":
      currentPiece.x--;
      if (collides(board, currentPiece)) currentPiece.x++;
      break;
    case "ArrowRight":
      currentPiece.x++;
      if (collides(board, currentPiece)) currentPiece.x--;
      break;
    case "ArrowDown":
      currentPiece.y++;
      if (collides(board, currentPiece)) currentPiece.y--;
      break;
    case "ArrowUp":
      rotate(currentPiece);
      break;
    case " ":
      hardDrop();
      break;
    case "Shift":
      hold();
      break;
  }
});

/* ============================
   スマホ操作
   ============================ */

document.getElementById("btn-left").onclick = () => {
  currentPiece.x--;
  if (collides(board, currentPiece)) currentPiece.x++;
};

document.getElementById("btn-right").onclick = () => {
  currentPiece.x++;
  if (collides(board, currentPiece)) currentPiece.x--;
};

document.getElementById("btn-down").onclick = () => {
  currentPiece.y++;
  if (collides(board, currentPiece)) currentPiece.y--;
};

document.getElementById("btn-rotate").onclick = () => rotate(currentPiece);

document.getElementById("btn-drop").onclick = () => hardDrop();

document.getElementById("btn-hold").onclick = () => hold();

/* ============================
   スキン変更
   ============================ */

document.getElementById("skin-select").onchange = (e) => {
  const skin = e.target.value;
  document.body.className = skin;
};

/* ============================
   リスタート
   ============================ */

document.getElementById("restart-btn").onclick = () => {
  document.getElementById("game-over").classList.add("hidden");
  startGame();
};

/* ============================
   ゲーム開始
   ============================ */

startGame();
