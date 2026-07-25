import { useState } from 'react';
import './Board.css';

function getConflicts(placedPieces, gridSize, pieceSize) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(-1));
  for (const { cells, boardRow, boardCol } of placedPieces) {
    for (let r = 0; r < pieceSize; r++)
      for (let c = 0; c < pieceSize; c++)
        grid[boardRow * pieceSize + r][boardCol * pieceSize + c] = cells[r][c];
  }
  const badRows = new Set(), badCols = new Set();
  for (let r = 0; r < gridSize; r++) {
    const seen = {};
    for (let c = 0; c < gridSize; c++) {
      const v = grid[r][c];
      if (v === -1) continue;
      if (seen[v] !== undefined) { badRows.add(r); }
      else seen[v] = c;
    }
  }
  for (let c = 0; c < gridSize; c++) {
    const seen = {};
    for (let r = 0; r < gridSize; r++) {
      const v = grid[r][c];
      if (v === -1) continue;
      if (seen[v] !== undefined) { badCols.add(c); }
      else seen[v] = r;
    }
  }
  return { badRows, badCols };
}

export default function Board({ gridSize, pieceSize, placedPieces, colors, onDrop, onUnplace, onRotateOnBoard, showSolution, winAnimation, showConflicts, showNumbers }) {
  const [dragOver, setDragOver] = useState(null);
  const slots = gridSize / pieceSize;
  const { badRows, badCols } = getConflicts(placedPieces, gridSize, pieceSize);

  function slotHasConflict(sr, sc) {
    for (let r = 0; r < pieceSize; r++)
      for (let c = 0; c < pieceSize; c++)
        if (badRows.has(sr * pieceSize + r) || badCols.has(sc * pieceSize + c)) return true;
    return false;
  }

  function handleDrop(e, slotRow, slotCol) {
    e.preventDefault();
    setDragOver(null);
    const pieceId = parseInt(e.dataTransfer.getData('pieceId'));
    const fromBoard = e.dataTransfer.getData('fromBoard') === 'true';
    onDrop(pieceId, slotRow, slotCol, fromBoard);
  }

  return (
    <div className="board" style={{ '--slots': slots }}>
      {Array.from({ length: slots }, (_, sr) =>
        Array.from({ length: slots }, (_, sc) => {
          const placed = placedPieces.find(p => p.boardRow === sr && p.boardCol === sc);
          const key = `${sr}-${sc}`;
          const isOver = dragOver === key;
          const hasConflict = placed && showConflicts && slotHasConflict(sr, sc);
          const winDelay = winAnimation ? (sr * slots + sc) * 0.08 : null;

          return (
            <div
              key={key}
              className={`board-slot ${placed ? 'filled' : 'empty'} ${isOver ? 'drag-over' : ''} ${hasConflict ? 'conflict' : ''}`}
              style={winAnimation ? { '--win-delay': `${winDelay}s` } : {}}
              onDragOver={e => { e.preventDefault(); setDragOver(key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, sr, sc)}
            >
              {placed && (
                <div
                  className={`placed-piece ${winAnimation ? 'win-bounce' : ''}`}
                  style={winAnimation ? { animationDelay: `${winDelay}s` } : {}}
                >
                  {showNumbers && !showSolution && <span className="piece-number-board">{placed.displayNumber}</span>}
                  {(showSolution ? placed.solvedCells : placed.cells).map((row, r) => (
                    <div key={r} className="piece-row">
                      {row.map((colorIdx, c) => (
                        <div key={c} className="board-cell" style={{ background: colors[colorIdx] }} />
                      ))}
                    </div>
                  ))}
                  {!showSolution && (
                    <div className="board-piece-actions">
                      <button className="btn-rotate-board" onClick={() => onRotateOnBoard(placed.id)} title="Rotate">↻</button>
                      <button className="btn-unplace" onClick={() => onUnplace(placed.id)} title="Return to tray">✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
