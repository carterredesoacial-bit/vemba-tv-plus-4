import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore, getHomeChannels } from '../store/useAppStore';
import { progressOf, timeLabel } from '../api/epgTime';
import { IconStar, IconPlay } from '../components/icons';

export function InicioScreen() {
  const channels = useAppStore((s) => s.channels);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const isLoading = useAppStore((s) => s.isLoading);
  const currentChannel = useAppStore((s) => s.currentChannel);
  const focusZone = useAppStore((s) => s.focusZone);
  const homeFocusIndex = useAppStore((s) => s.homeFocusIndex);
  const setChannel = useAppStore((s) => s.setChannel);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setHomeFocusIndex = useAppStore((s) => s.setHomeFocusIndex);

  const [now, setNow] = useState(() => Date.now());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const row = useMemo(() => getHomeChannels(channels, favoriteIds), [channels, favoriteIds]);
  const hasFavorites = favoriteIds.some((id) => channels.some((c) => c.id === id));
  const focusIdx = row.length > 0 ? Math.min(homeFocusIndex, row.length - 1) : 0;
  const featured = row[focusIdx];

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Mantém o cartão focado pelo comando sempre visível na fileira
  useEffect(() => {
    const el = cardRefs.current[focusIdx];
    if (el) el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [focusIdx]);

  const watch = (index: number) => {
    const ch = row[index];
    if (!ch) return;
    setHomeFocusIndex(index);
    setChannel(ch, 0);
    setActiveTab('tv');
  };

  const current = featured?.epg?.current;
  const progress = progressOf(current, now);
  const quality = featured?.embeds?.[0]?.quality;

  return (
    <div className="inicio">
      <svg className="inicio-waves" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 150 C 120 90, 240 210, 380 140 S 640 90, 800 150" fill="none" stroke="#00b8ff" strokeWidth="1.2" opacity="0.5" />
        <path d="M0 165 C 140 110, 260 220, 400 160 S 650 110, 800 170" fill="none" stroke="#00b8ff" strokeWidth="1" opacity="0.35" />
        <path d="M0 180 C 150 130, 280 230, 420 175 S 660 130, 800 190" fill="none" stroke="#00b8ff" strokeWidth="0.8" opacity="0.25" />
      </svg>

      {/* Banner do canal em foco */}
      <div className="hero">
        {current?.image && (
          <img
            key={current.image}
            className="hero-image"
            src={current.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="hero-fade" />

        {featured ? (
          <div className="hero-content">
            <div className="hero-live">
              <span className="epg-dot" /> Agora a transmitir
            </div>
            {featured.logo_url && (
              <img className="hero-logo" src={featured.logo_url} alt="" referrerPolicy="no-referrer" />
            )}
            <div className="hero-channel">{featured.name}</div>
            <div className="hero-title">{current?.title || featured.description || featured.category}</div>
            {quality && <span className="hero-quality">{quality.toUpperCase()}</span>}
            {progress !== null && (
              <div className="hero-track">
                <div className="epg-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
            {timeLabel(current) && <div className="hero-time">{timeLabel(current)}</div>}
            <button className="hero-btn" onClick={() => watch(focusIdx)}>
              <IconPlay size={18} /> Ver em Direto
            </button>
          </div>
        ) : (
          <div className="hero-content">
            <div className="hero-title">
              {isLoading ? 'A carregar canais...' : 'Sem canais por agora. Confere a internet e reinicia o app.'}
            </div>
          </div>
        )}
      </div>

      {/* Fileira de canais */}
      <div className="row-head">
        <h3>
          <IconStar size={26} /> {hasFavorites ? 'Canais Favoritos' : 'Canais'}
        </h3>
        <button className="row-all" onClick={() => setActiveTab('tv')}>Ver Todos ›</button>
      </div>

      <div className="row">
        {row.map((ch, idx) => {
          const isFocused = focusZone === 'list' && focusIdx === idx;
          const isPlaying = currentChannel?.id === ch.id;
          return (
            <div
              key={ch.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              className={`card ${isFocused ? 'focused-item' : ''}`}
              onClick={() => watch(idx)}>
              {isPlaying && <span className="card-dot" />}
              <div className="card-logo">
                {ch.logo_url ? (
                  <img src={ch.logo_url} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="card-fallback">{ch.name}</span>
                )}
              </div>
              <div className="card-name">{ch.name}</div>
            </div>
          );
        })}
      </div>

      <div className="inicio-footer">
        <strong>VEMBA <span>TV Plus</span></strong>
        <i />
        <span>Assista o que ama, quando e onde quiser</span>
      </div>
    </div>
  );
}
