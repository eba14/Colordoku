// Returns true if the fully placed board has no repeating color in any row or column
export function validateBoard(grid, gridSize) {
  for (let r = 0; r < gridSize; r++) {
    const rowSet = new Set();
    for (let c = 0; c < gridSize; c++) {
      const val = grid[r][c];
      if (val === -1 || rowSet.has(val)) return false;
      rowSet.add(val);
    }
  }
  for (let c = 0; c < gridSize; c++) {
    const colSet = new Set();
    for (let r = 0; r < gridSize; r++) {
      const val = grid[r][c];
      if (val === -1 || colSet.has(val)) return false;
      colSet.add(val);
    }
  }
  return true;
}

// Build a flat grid from placed pieces
export function buildGridFromPieces(placedPieces, gridSize, pieceSize) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(-1));
  for (const { cells, boardRow, boardCol } of placedPieces) {
    for (let r = 0; r < pieceSize; r++) {
      for (let c = 0; c < pieceSize; c++) {
        grid[boardRow * pieceSize + r][boardCol * pieceSize + c] = cells[r][c];
      }
    }
  }
  return grid;
}
