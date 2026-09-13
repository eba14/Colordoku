import { useEffect, useRef, useState } from 'react';
import './Timer.css';

export default function Timer({ running, onTick, initialSeconds = 0 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  // Report ticks to the parent from an effect, not from inside the setSeconds
  // updater — calling another component's setState mid-render is unsafe in React 19.
  useEffect(() => {
    onTick?.(seconds);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return <div className="timer">{mm}:{ss}</div>;
}
