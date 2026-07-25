import { useState } from 'react';
import './ModeSelector.css';

const MODES = [
  { key: 'easy',   label: 'Easy',   desc: '4×4 · 4 colors · 4 pieces (2×2)',  color: '#5a9e6f' },
  { key: 'medium', label: 'Medium', desc: '6×6 · 6 colors · 4 pieces (3×3)',  color: '#4a7fb5' },
  { key: 'hard',   label: 'Hard',   desc: '6×6 · 6 colors · 9 pieces (2×2)',  color: '#c07a3a' },
  { key: 'expert', label: 'Expert', desc: '9×9 · 9 colors · 9 pieces (3×3)', color: '#8b5ca8' },
];

export default function ModeSelector({ onSelect }) {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="mode-selector">
      <div className="title-block">
        <h1 className="title">Colordoku</h1>
        <p className="subtitle">A color-based logic puzzle. Place & rotate pieces so no color repeats in any row or column.</p>
      </div>

      <div className="mode-grid">
        {MODES.map(({ key, label, desc, color }) => (
          <button key={key} className="mode-btn" style={{ '--mode-color': color }} onClick={() => onSelect(key)}>
            <span className="mode-dot" style={{ background: color }} />
            <span className="mode-label">{label}</span>
            <span className="mode-desc">{desc}</span>
          </button>
        ))}
      </div>

      <button className="btn-how" onClick={() => setShowHow(true)}>How to Play</button>

      {showHow && (
        <div className="modal-overlay" onClick={() => setShowHow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>How to Play</h2>
            <ol>
              <li>Select a difficulty to generate a new puzzle.</li>
              <li>Drag pieces from the tray onto the <strong>scratch board</strong> to plan your layout.</li>
              <li>Use <strong>↻</strong> to rotate any piece before or after placing it.</li>
              <li>Hover a placed piece to rotate it or return it to the tray.</li>
              <li>The rule: no color may appear more than once in any <strong>row or column</strong>.</li>
              <li>When all pieces are placed, hit <strong>Check</strong> to validate your answer.</li>
              <li>Stuck? Hit <strong>Give Up</strong> to reveal the answer key.</li>
            </ol>
            <button className="btn-close" onClick={() => setShowHow(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
