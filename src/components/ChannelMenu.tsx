import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { timeLabel, toMs } from '../api/epgTime';

// Menu horizontal de canais por cima do vídeo (Select).
// No canal em foco: "Agora" assiste, "A seguir" agenda a troca.
export function ChannelMenu() {
  const overlay = useAppStore((s) => s.overlay);
  const channels = useAppStore((s) => s.channels);
  const focusIdx = useAppStore((s) => s.channelFocusIndex);
  const sub = useAppStore((s) => s.menuSub);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const schedules = useAppStore((s) => s.schedules);
  const currentChannel = useAppStore((s) => s.currentChannel);
  const setChannelFocusIndex = useAppStore((s) => s.setChannelFocusIndex);
  const setMenuSub = useAppStore((s) => s.setMenuSub);
  const activateMenu = useAppStore((s) => s.activateMenu);

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const open = overlay === 'channels';

  useEffect(() => {
    if (!open) return;
    const el = refs.current[focusIdx];
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [open, focusIdx]);

  if (!open) return null;

  const pick = (index: number, subRow: 0 | 1) => {
    setChannelFocusIndex(index);
    setMenuSub(subRow);
    activateMenu();
  };

  return (
    <div className="cm-overlay">
      <div className="cm-strip">
        {channels.map((ch, idx) => {
          const focused = idx === focusIdx;
          const cur = ch.epg?.current;
          const next = ch.epg?.next;
          const nextStart = toMs(next?.start_time);
          const isScheduled = !!nextStart && schedules.some((s) => s.id === `${ch.id}-${nextStart}`);
          const isFav = favoriteIds.includes(ch.id);
          const isPlaying = currentChannel?.id === ch.id;

          return (
            <div
              key={ch.id}
              ref={(el) => { refs.current[idx] = el; }}
              className={`cm-card ${focused ? 'cm-card-focus' : ''}`}
              onClick={() => (focused ? undefined : pick(idx, 0))}>
              {isFav && <span className="cm-star">★</span>}
              {isPlaying && <span className="card-dot" />}
              <div className="cm-logo">
                {ch.logo_url ? (
                  <img src={ch.logo_url} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="card-fallback">{ch.name}</span>
                )}
              </div>
              <div className="cm-name">{ch.name}</div>

              {focused && (
                <div className="cm-epg">
                  <div
                    className={`cm-row ${sub === 0 ? 'cm-row-sel' : ''}`}
                    onClick={() => pick(idx, 0)}>
                    <span><b>Agora:</b> {cur?.title || ch.category}</span>
                    <small>{timeLabel(cur)}</small>
                  </div>
                  {next && (
                    <div
                      className={`cm-row ${sub === 1 ? 'cm-row-sel' : ''}`}
                      onClick={() => pick(idx, 1)}>
                      <span><b>A seguir:</b> {next.title} {isScheduled && '⏰'}</span>
                      <small>{timeLabel(next)}</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="cm-hint">
        ◄ ► Canal  |  ▲ Agora  |  ▼ A seguir  |  A Assistir ou agendar  |  Start Agendar o seguinte  |  Y Favoritar  |  B Fechar
      </div>
    </div>
  );
}
