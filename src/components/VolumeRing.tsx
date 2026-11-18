import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const SIZE = 168;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2 - 2;
const CIRC = 2 * Math.PI * RADIUS;
const SHOW_MS = 1800;

function SpeakerIcon({ muted, level }: { muted: boolean; level: number }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5v5h4l5 4v-13l-5 4H3z" fill="#fff" />
      {muted || level === 0 ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          {level > 50 && (
            <path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
}

// Aparece no meio da tela quando o volume muda e some sozinho
export function VolumeRing() {
  const volume = useAppStore((s) => s.volume);
  const muted = useAppStore((s) => s.muted);
  const tick = useAppStore((s) => s.volumeRingTick);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tick === 0) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(hide);
  }, [tick]);

  const shown = muted ? 0 : volume;
  const offset = CIRC * (1 - shown / 100);

  return (
    <div className={`volume-ring ${visible ? 'volume-ring-show' : ''}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="vol-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#ff3cac" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#vol-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.12s linear' }}
        />
      </svg>
      <div className="volume-ring-inner">
        <SpeakerIcon muted={muted} level={shown} />
        <div className="volume-ring-number">
          {shown}
          <span>%</span>
        </div>
      </div>
    </div>
  );
}
