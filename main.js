const grid = document.querySelector(".grid");
const width = 10;
const height = 20;
let cells = [];
let currentPos = 3;
let currentShape = 0;

// テトリミノの形
const shapes = [
  [1, width + 1, width * 2 + 1, 2], // I
  [0, width, width + 1, width * 2 + 1], // L
  [1, width, width + 1, width + 2], // T
];

// グリッドを作成
for (let i = 0; i < width * height; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  grid.appendChild(cell);
  cells.push(cell);
}

// 描画
function draw() {
  shapes[currentShape].forEach(i => {
    cells[currentPos + i].classList.add("active");
  });
}

// 消去
function undraw() {
  shapes[currentShape].forEach(i => {
    cells[currentPos + i].classList.remove("active");
  });
}

// 下に移動
function moveDown() {
  undraw();
  currentPos += width;

  if (collision()) {
    currentPos -= width;
    fix();
    newShape();
  }

  draw();
}

// 衝突判定
function collision() {
  return shapes[currentShape].some(i => {
    const next = currentPos + i;
    return next >= width * height || cells[next].classList.contains("fixed");
  });
}

// 固定
function fix() {
  shapes[currentShape].forEach(i => {
    cells[currentPos + i].classList.add("fixed");
  });
}

// 新しいブロック
function newShape() {
  currentPos = 3;
  currentShape = Math.floor(Math.random() * shapes.length);
}

// キー操作
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") {
    undraw();
    currentPos--;
    if (collision()) currentPos++;
    draw();
  }
  if (e.key === "ArrowRight") {
    undraw();
    currentPos++;
    if (collision()) currentPos--;
    draw();
  }
  if (e.key === "ArrowUp") {
    undraw();
    currentShape = (currentShape + 1) % shapes.length;
    if (collision()) currentShape = (currentShape - 1 + shapes.length) % shapes.length;
    draw();
  }
});

// 落下処理
setInterval(moveDown, 500);

// 初期描画
draw();
