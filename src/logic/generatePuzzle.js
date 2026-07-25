import { generateSolvedGrid, countPieceSolutions } from './solver';
import { pickColors } from './colors';

export const MODES = {
  easy:   { gridSize: 4, pieceSize: 2, numPieces: 4, numColors: 4 },
  medium: { gridSize: 6, pieceSize: 3, numPieces: 4, numColors: 6 },
  hard:   { gridSize: 6, pieceSize: 2, numPieces: 9, numColors: 6 },
  expert: { gridSize: 9, pieceSize: 3, numPieces: 9, numColors: 9 },
};

function rotateCW(matrix) {
  const n = matrix.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => matrix[n - 1 - c][r])
  );
}

function getAllRotations(matrix) {
  const rotations = [matrix];
  for (let i = 1; i < 4; i++) rotations.push(rotateCW(rotations[i - 1]));
  return rotations;
}

function rotateK(matrix, k) {
  let m = matrix;
  for (let i = 0; i < k % 4; i++) m = rotateCW(m);
  return m;
}

function buildPiecesAndSlots(solvedGrid, gridSize, pieceSize, numPieces) {
  const piecesPerRow = gridSize / pieceSize;
  const pieces = [];
  const slots = [];

  for (let pr = 0; pr < piecesPerRow && pieces.length < numPieces; pr++) {
    for (let pc = 0; pc < piecesPerRow && pieces.length < numPieces; pc++) {
      const cells = Array.from({ length: pieceSize }, (_, r) =>
        Array.from({ length: pieceSize }, (_, c) =>
          solvedGrid[pr * pieceSize + r][pc * pieceSize + c]
        )
      );
      pieces.push({ rotations: getAllRotations(cells), solvedCells: cells });
      slots.push({ row: pr, col: pc });
    }
  }
  return { pieces, slots };
}

export function generatePuzzle(mode) {
  const { gridSize, pieceSize, numPieces, numColors } = MODES[mode];
  const colors = pickColors(numColors);

  let solvedGrid, pieces, slots, solutionCount;
  let attempts = 0;

  // Retry until we get a puzzle with 1–4 solutions (unique, ignoring whole-board rotations)
  do {
    solvedGrid = generateSolvedGrid(gridSize, numColors);
    ({ pieces, slots } = buildPiecesAndSlots(solvedGrid, gridSize, pieceSize, numPieces));
    solutionCount = countPieceSolutions(pieces, slots, pieceSize, gridSize, 5);
    attempts++;
    // Safety: don't loop forever on easy mode (4x4 is inherently less constrained)
    if (attempts > 30) break;
  } while (solutionCount > 4);

  // Assign random starting rotations + random display numbers (shuffled, not sequential)
  const numbers = Array.from({ length: numPieces }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5);

  const finalPieces = pieces.map((p, i) => {
    const rotation = Math.floor(Math.random() * 4);
    return {
      id: i,
      displayNumber: numbers[i],
      cells: rotateK(p.solvedCells, rotation),
      solvedCells: p.solvedCells,
      solvedRow: slots[i].row,
      solvedCol: slots[i].col,
    };
  });

  return { pieces: finalPieces, solvedGrid, colors, gridSize, pieceSize, numPieces, numColors };
}
