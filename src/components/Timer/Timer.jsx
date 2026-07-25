import { useEffect, useRef, useState } from 'react';
import './Timer.css';

export default function Timer({ running, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds(s => {
          const next = s + 1;
          onTick?.(next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return <div className="timer">{mm}:{ss}</div>;
}
