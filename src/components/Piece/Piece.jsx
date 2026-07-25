import './Piece.css';

export default function Piece({ piece, colors, selected, onClick, onDragStart, showNumbers }) {
  return (
    <div
      className={`piece ${selected ? 'selected' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      {showNumbers && <span className="piece-number">{piece.displayNumber}</span>}
      {piece.cells.map((row, r) => (
        <div key={r} className="piece-row">
          {row.map((colorIdx, c) => (
            <div key={c} className="piece-cell" style={{ background: colors[colorIdx] }} />
          ))}
        </div>
      ))}
    </div>
  );
}
