'use client';

import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export function Timer({ expiresAt, onExpire }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = secondsLeft <= 600;
  const isCritical = secondsLeft <= 60;

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded ${
      isCritical ? 'bg-red-100 text-red-700' : isWarning ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
    }`}>
      <span>⏱</span>
      <span>{display}</span>
      {isCritical && <span className="text-xs font-normal">1 min left!</span>}
      {isWarning && !isCritical && <span className="text-xs font-normal">10 min left</span>}
    </div>
  );
}
