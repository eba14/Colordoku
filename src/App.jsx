import { useState, useEffect, useRef } from 'react';
import ModeSelector from './components/ModeSelector/ModeSelector';
import Board from './components/Board/Board';
import Piece from './components/Piece/Piece';
import Timer from './components/Timer/Timer';
import { generatePuzzle } from './logic/generatePuzzle';
import { validateBoard, buildGridFromPieces } from './logic/validateBoard';
import './App.css';

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function MiniGrid({ grid, colors, gridSize }) {
  const cellSize = Math.max(16, Math.floor(160 / gridSize));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 2, borderRadius: 6, overflow: 'hidden' }}>
      {grid.map((row, r) => row.map((colorIdx, c) => (
        <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize, background: colorIdx >= 0 ? colors[colorIdx] : '#e8dfd0' }} />
      )))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">{label}</span>
      <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
    </label>
  );
}

function LoadingTransition({ mode, modeColor, onDone }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 60);
    const t2 = setTimeout(onDone, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="loading-screen" style={{ '--load-color': modeColor }}>
      <div className="loading-mode-label">{mode}</div>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" style={{ width: started ? '100%' : '0%' }} />
      </div>
      <div className="loading-hint">Generating puzzle…</div>
    </div>
  );
}

function Countdown({ onDone }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count === 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <div className="countdown-overlay">
      <span key={count} className={`countdown-number ${count === 0 ? 'go' : ''}`}>
        {count === 0 ? 'Go!' : count}
      </span>
    </div>
  );
}

const MODE_COLORS = {
  easy: '#5a9e6f', medium: '#4a7fb5', hard: '#c07a3a', expert: '#8b5ca8'
};

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [puzzle, setPuzzle] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [placedPieces, setPlacedPieces] = useState([]);
  const [playerGrid, setPlayerGrid] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [winAnimation, setWinAnimation] = useState(false);
  const [currentMode, setCurrentMode] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState(false);
  // give-up animation phases: none | collecting | rotating | placing | done
  const [giveUpPhase, setGiveUpPhase] = useState('none');
  const [giveUpPlacingId, setGiveUpPlacingId] = useState(null);
  const [lastSolvedPieceId, setLastSolvedPieceId] = useState(null);
  const puzzleRef = useRef(null);

  // Press R to rotate the selected tray piece
  useEffect(() => {
    if (screen !== 'game') return;
    function onKey(e) {
      if ((e.key === 'r' || e.key === 'R') && selectedId !== null && giveUpPhase === 'none') {
        rotatePiece(selectedId);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, selectedId, giveUpPhase]);

  function handleModeSelect(mode) {
    puzzleRef.current = generatePuzzle(mode);
    setCurrentMode(mode);
    setScreen('loading');
  }

  function handleLoadingDone() { setScreen('countdown'); }

  function handleCountdownDone() {
    const p = puzzleRef.current;
    setPuzzle(p);
    setPieces(p.pieces);
    setPlacedPieces([]);
    setPlayerGrid(null);
    setSelectedId(null);
    setShowSolution(false);
    setWinAnimation(false);
    setIncorrectFeedback(false);
    setTimerRunning(true);
    setShowSettings(false);
    setGiveUpPhase('none');
    setGiveUpPlacingId(null);
    setLastSolvedPieceId(null);
    setScreen('game');
  }

  function startGame(mode) {
    puzzleRef.current = generatePuzzle(mode);
    setCurrentMode(mode);
    setScreen('loading');
  }

  function rotatePiece(id, fromBoard = false) {
    const rotate = cells => {
      const n = cells.length;
      return Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => cells[n - 1 - c][r])
      );
    };
    if (fromBoard) {
      setPlacedPieces(prev => prev.map(p => p.id !== id ? p : { ...p, cells: rotate(p.cells) }));
    } else {
      setPieces(prev => prev.map(p => p.id !== id ? p : { ...p, cells: rotate(p.cells) }));
    }
    setIncorrectFeedback(false);
  }

  function unplacePiece(id) {
    const placed = placedPieces.find(p => p.id === id);
    if (!placed) return;
    setPlacedPieces(prev => prev.filter(p => p.id !== id));
    setPieces(prev => prev.map(p => p.id !== id ? p : { ...p, cells: placed.cells }));
    setIncorrectFeedback(false);
  }

  function handleDrop(pieceId, slotRow, slotCol) {
    const trayPiece = pieces.find(p => p.id === pieceId);
    const boardPiece = placedPieces.find(p => p.id === pieceId);
    const piece = trayPiece || boardPiece;
    if (!piece) return;
    const withoutThis = placedPieces.filter(p => p.id !== pieceId);
    const displaced = withoutThis.find(p => p.boardRow === slotRow && p.boardCol === slotCol);
    const newPlaced = [
      ...withoutThis.filter(p => !(p.boardRow === slotRow && p.boardCol === slotCol)),
      { ...piece, boardRow: slotRow, boardCol: slotCol }
    ];
    if (displaced) setPieces(prev => prev.map(p => p.id !== displaced.id ? p : { ...p, cells: displaced.cells }));
    setPlacedPieces(newPlaced);
    setSelectedId(null);
    setIncorrectFeedback(false);
  }

  function handleCheck() {
    if (placedPieces.length !== puzzle.numPieces) return;
    const grid = buildGridFromPieces(placedPieces, puzzle.gridSize, puzzle.pieceSize);
    if (validateBoard(grid, puzzle.gridSize)) {
      setTimerRunning(false);
      setWinAnimation(true);
      setPlayerGrid(grid);
      setTimeout(() => setScreen('win'), 1400);
    } else {
      setIncorrectFeedback(true);
      setTimeout(() => setIncorrectFeedback(false), 3000);
    }
  }

  function handleGiveUp() {
    if (giveUpPhase !== 'none') return;
    setTimerRunning(false);
    setIncorrectFeedback(false);
    setSelectedId(null);
    setShowSettings(false);
    setGiveUpPhase('collecting');

    const solved = puzzle.pieces.map(p => ({
      ...p, cells: p.solvedCells, boardRow: p.solvedRow, boardCol: p.solvedCol,
    }));
    // Place pieces top-left → bottom-right for a satisfying reveal sweep
    const sortedSolved = [...solved].sort((a, b) =>
      a.boardRow !== b.boardRow ? a.boardRow - b.boardRow : a.boardCol - b.boardCol
    );

    // Phase 1 — collecting: board pieces shrink away (700 ms)
    setTimeout(() => {
      setPlacedPieces([]);
      setPieces(sortedSolved.map(p => ({
        id: p.id, displayNumber: p.displayNumber,
        cells: p.solvedCells, solvedCells: p.solvedCells,
        solvedRow: p.solvedRow, solvedCol: p.solvedCol,
      })));
      setGiveUpPhase('rotating');

      // Phase 2 — rotating: tray pieces spin to correct orientation (1000 ms)
      setTimeout(() => {
        setGiveUpPhase('placing');

        // Phase 3 — placing: one by one, tray → board
        sortedSolved.forEach((piece, i) => {
          setTimeout(() => {
            setGiveUpPlacingId(piece.id);
            setTimeout(() => {
              setLastSolvedPieceId(piece.id);
              setPlacedPieces(prev => [...prev, piece]);
              setPieces(prev => prev.filter(p => p.id !== piece.id));
              setGiveUpPlacingId(null);
              setTimeout(() => setLastSolvedPieceId(null), 500);
            }, 300);
          }, i * 540);
        });

        // Phase 4 — done: reveal banner
        setTimeout(() => {
          setGiveUpPhase('done');
          setShowSolution(true);
          setPieces([]);
        }, sortedSolved.length * 540 + 500);

      }, 1000);
    }, 700);
  }

  const unplacedPieces = pieces.filter(p => !placedPieces.find(pp => pp.id === p.id));
  const allPlaced = puzzle && placedPieces.length === puzzle.numPieces;
  const isAnimating = giveUpPhase !== 'none' && giveUpPhase !== 'done';

  if (screen === 'menu') return (
    <ModeSelector
      onSelect={handleModeSelect}
      showNumbers={showNumbers}
      onShowNumbers={setShowNumbers}
      showConflicts={showConflicts}
      onShowConflicts={setShowConflicts}
    />
  );

  if (screen === 'loading') return (
    <LoadingTransition mode={currentMode} modeColor={MODE_COLORS[currentMode]} onDone={handleLoadingDone} />
  );

  if (screen === 'countdown') return (
    <div className="game-screen">
      <Countdown onDone={handleCountdownDone} />
    </div>
  );

  if (screen === 'win') return (
    <div className="win-screen">
      <div className="win-card">
        <div className="win-icon">✦</div>
        <h1 className="win-title">Solved</h1>
        <p className="win-sub">Puzzle complete</p>
        <div className="win-stats">
          <div className="stat">
            <span className="stat-label">Mode</span>
            <span className="stat-value">{currentMode}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(finalTime)}</span>
          </div>
        </div>
        <div className="answer-compare">
          <div className="answer-col">
            <p className="answer-label">Your Solution</p>
            <MiniGrid grid={playerGrid} colors={puzzle.colors} gridSize={puzzle.gridSize} />
          </div>
          <div className="answer-col">
            <p className="answer-label">Answer Key</p>
            <MiniGrid grid={puzzle.solvedGrid} colors={puzzle.colors} gridSize={puzzle.gridSize} />
          </div>
        </div>
        <div className="win-actions">
          <button className="btn-primary" onClick={() => startGame(currentMode)}>Play Again</button>
          <button className="btn-secondary" onClick={() => setScreen('menu')}>Change Mode</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="game-screen game-enter">
      <div className="game-header">
        <button className="btn-back" onClick={() => { setTimerRunning(false); setScreen('menu'); }}>← Menu</button>
        <Timer running={timerRunning} onTick={setFinalTime} />
        <div className="header-right">
          {!isAnimating && (
            <button className={`btn-settings ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(s => !s)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
          {giveUpPhase !== 'done' && (
            <button
              className={`btn-giveup ${isAnimating ? 'solving' : ''}`}
              onClick={handleGiveUp}
              disabled={isAnimating}
            >
              {isAnimating ? 'Solving…' : 'Give Up'}
            </button>
          )}
        </div>
      </div>

      {showSettings && !isAnimating && (
        <div className="settings-panel">
          <Toggle label="Piece Numbers" checked={showNumbers} onChange={setShowNumbers} />
          <div className="settings-divider" />
          <Toggle label="Conflict Highlights" checked={showConflicts} onChange={setShowConflicts} />
        </div>
      )}

      {showSolution && <p className="solution-banner">Answer key revealed</p>}
      {incorrectFeedback && <div className="feedback-toast incorrect">That's incorrect — try again.</div>}

      <Board
        gridSize={puzzle.gridSize}
        pieceSize={puzzle.pieceSize}
        placedPieces={placedPieces}
        colors={puzzle.colors}
        onDrop={handleDrop}
        onUnplace={unplacePiece}
        onRotateOnBoard={id => rotatePiece(id, true)}
        showSolution={showSolution}
        winAnimation={winAnimation}
        showConflicts={showConflicts}
        showNumbers={showNumbers}
        giveUpPhase={giveUpPhase}
        lastSolvedPieceId={lastSolvedPieceId}
      />

      <div className="tray-section">
        {unplacedPieces.length > 0 && (
          <>
            <p className="tray-label">
              {unplacedPieces.length} piece{unplacedPieces.length !== 1 ? 's' : ''} remaining
            </p>
            <div className="pieces-tray">
              {unplacedPieces.map((piece, idx) => (
                <div
                  key={piece.id}
                  className={`piece-wrapper ${giveUpPhase === 'rotating' ? 'give-up-rotating' : ''} ${giveUpPlacingId === piece.id ? 'give-up-lifting' : ''}`}
                  style={{ '--spin-delay': `${idx * 0.1}s` }}
                >
                  <Piece
                    piece={piece}
                    colors={puzzle.colors}
                    selected={selectedId === piece.id}
                    showNumbers={showNumbers}
                    onClick={() => !isAnimating && setSelectedId(selectedId === piece.id ? null : piece.id)}
                    onDragStart={e => {
                      if (isAnimating) { e.preventDefault(); return; }
                      e.dataTransfer.setData('pieceId', piece.id);
                    }}
                  />
                  <button
                    className="btn-rotate"
                    onClick={() => !isAnimating && rotatePiece(piece.id)}
                    disabled={isAnimating}
                  >↻</button>
                </div>
              ))}
            </div>
          </>
        )}
        {!showSolution && giveUpPhase === 'none' && (
          <button
            className={`btn-check ${allPlaced ? 'ready' : 'disabled'}`}
            onClick={handleCheck}
            disabled={!allPlaced}
          >
            {allPlaced ? 'Check Answer' : `Place all ${puzzle.numPieces} pieces to check`}
          </button>
        )}
      </div>
    </div>
  );
}
