import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export function SportsScreen() {
  const { liveSports, playSport, focusZone, sportFocusIndex } = useAppStore();

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mantém o evento focado pelo comando sempre visível
  useEffect(() => {
    const el = itemRefs.current[sportFocusIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [sportFocusIndex]);

  return (
    <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
      <h2 style={{ color: '#00f0ff', marginBottom: '20px' }}>Esportes Ao Vivo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {liveSports.map((sport, sportIdx) => {
          const isFocused = focusZone === 'list' && sportFocusIndex === sportIdx;

          return (
            <div
              key={sport.id}
              ref={(el) => { itemRefs.current[sportIdx] = el; }}
              className={isFocused ? 'focused-item' : ''}
              style={{ backgroundColor: '#131b2e', borderRadius: '12px', padding: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#00f0ff', fontWeight: 'bold' }}>{sport.competition}</div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{sport.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{sport.description}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {sport.embeds.map((emb, idx) => (
                  <button
                    key={idx}
                    onClick={() => playSport(sport, idx)}
                    style={{ background: '#00f0ff', color: '#0b0f19', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Assistir via {emb.provider}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {liveSports.length === 0 && <p style={{ color: '#94a3b8' }}>Nenhum evento esportivo ao vivo no momento.</p>}
      </div>
    </div>
  );
}
