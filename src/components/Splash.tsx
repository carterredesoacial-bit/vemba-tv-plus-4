import React, { useEffect, useState } from 'react';

// Tempo mínimo da animação (ms), tempo máximo à espera dos dados e início da barra
const SPLASH_MIN_MS = 4600;
const SPLASH_MAX_MS = 9000;
const PROGRESS_START_MS = 2800;

interface SplashProps {
  dataReady: boolean;
  onDone: () => void;
}

export function Splash({ dataReady, onDone }: SplashProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setElapsed(performance.now() - start), 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ((elapsed >= SPLASH_MIN_MS && dataReady) || elapsed >= SPLASH_MAX_MS) onDone();
  }, [elapsed, dataReady, onDone]);

  const raw = Math.min(1, Math.max(0, (elapsed - PROGRESS_START_MS) / (SPLASH_MIN_MS - PROGRESS_START_MS)));
  const percent = raw >= 1 && !dataReady ? 99 : Math.round(raw * 100);

  return (
    <div className="splash">
      <div className="sp-glow" />
      <div className="sp-floor" />
      <div className="sp-flare">
        <span className="sp-flare-line" />
        <span className="sp-flare-core" />
      </div>
      <div className="sp-burst" />

      <div className="sp-stage">
        <div className="sp-logo-wrap">
          <svg className="sp-orbit" viewBox="0 0 300 160">
            <ellipse cx="150" cy="80" rx="140" ry="42" className="sp-orbit-a" />
            <ellipse cx="150" cy="80" rx="122" ry="30" className="sp-orbit-b" />
          </svg>
          <svg className="sp-logo" viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="18" width="52" height="38" rx="8" pathLength="1" className="sp-draw" />
            <path d="M22 6l10 12 10-12" pathLength="1" className="sp-draw sp-draw-2" />
            <path d="M27 29v16l14-8z" className="sp-play" />
          </svg>
        </div>

        <div className="sp-title">
          <span className="sp-white">VEMBA</span> <span className="sp-cyan">TV Plus</span>
        </div>

        <div className="sp-loader">
          <div className="sp-bar"><i style={{ width: `${percent}%` }} /></div>
          <span className="sp-pct">{percent}%</span>
        </div>
        <div className="sp-status">A iniciar...</div>
      </div>
    </div>
  );
}
