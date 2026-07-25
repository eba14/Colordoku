function isValid(grid, row, col, colorIndex, gridSize) {
  for (let i = 0; i < gridSize; i++) {
    if (grid[row][i] === colorIndex) return false;
    if (grid[i][col] === colorIndex) return false;
  }
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function solve(grid, gridSize, numColors) {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === -1) {
        const order = shuffle([...Array(numColors).keys()]);
        for (const color of order) {
          if (isValid(grid, row, col, color, gridSize)) {
            grid[row][col] = color;
            if (solve(grid, gridSize, numColors)) return true;
            grid[row][col] = -1;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSolvedGrid(gridSize, numColors) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(-1));
  solve(grid, gridSize, numColors);
  return grid;
}

// Rotate a square 2D array 90° clockwise
function rotateCW(matrix) {
  const n = matrix.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => matrix[n - 1 - c][r])
  );
}

function gridKey(grid) {
  return grid.map(r => r.join(',')).join('|');
}

// Get all 4 rotations of a full grid
function allGridRotations(grid) {
  const rotations = [];
  let g = grid;
  for (let i = 0; i < 4; i++) {
    rotations.push(gridKey(g));
    g = rotateCW(g);
  }
  return rotations;
}

// Count distinct solutions for a piece-placement puzzle (stops at limit)
// pieces: array of { rotations: [cells0, cells1, cells2, cells3] }
// slots: array of { row, col } board positions
// pieceSize, gridSize
export function countPieceSolutions(pieces, slots, pieceSize, gridSize, limit = 5) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(-1));
  const seenGrids = new Set();
  let count = 0;

  function canPlace(cells, slotRow, slotCol) {
    for (let r = 0; r < pieceSize; r++)
      for (let c = 0; c < pieceSize; c++) {
        const gr = slotRow * pieceSize + r;
        const gc = slotCol * pieceSize + c;
        const color = cells[r][c];
        // Check row
        for (let x = 0; x < gridSize; x++)
          if (grid[gr][x] === color) return false;
        // Check col
        for (let x = 0; x < gridSize; x++)
          if (grid[x][gc] === color) return false;
      }
    return true;
  }

  function place(cells, slotRow, slotCol) {
    for (let r = 0; r < pieceSize; r++)
      for (let c = 0; c < pieceSize; c++)
        grid[slotRow * pieceSize + r][slotCol * pieceSize + c] = cells[r][c];
  }

  function unplace(slotRow, slotCol) {
    for (let r = 0; r < pieceSize; r++)
      for (let c = 0; c < pieceSize; c++)
        grid[slotRow * pieceSize + r][slotCol * pieceSize + c] = -1;
  }

  function backtrack(pieceIdx) {
    if (count >= limit) return;
    if (pieceIdx === pieces.length) {
      const key = gridKey(grid);
      // Ignore if this grid is a rotation of an already-seen solution
      const rotKeys = allGridRotations(grid);
      if (rotKeys.some(k => seenGrids.has(k))) return;
      seenGrids.add(key);
      count++;
      return;
    }
    const { rotations } = pieces[pieceIdx];
    const { row, col } = slots[pieceIdx];
    const tried = new Set();
    for (const cells of rotations) {
      const key = cells.map(r => r.join(',')).join('|');
      if (tried.has(key)) continue; // skip duplicate rotations (e.g. symmetric pieces)
      tried.add(key);
      if (canPlace(cells, row, col)) {
        place(cells, row, col);
        backtrack(pieceIdx + 1);
        unplace(row, col);
        if (count >= limit) return;
      }
    }
  }

  backtrack(0);
  return count;
}
