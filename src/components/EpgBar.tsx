import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { progressOf, timeLabel } from '../api/epgTime';

const SHOW_MS = 6000;

// Aparece ao trocar de canal (ou de servidor), ao apertar L3 / I, e some sozinha
export function EpgBar() {
  const currentChannel = useAppStore((s) => s.currentChannel);
  const currentEmbedIndex = useAppStore((s) => s.currentEmbedIndex);
  const infoTick = useAppStore((s) => s.infoTick);
  const [visible, setVisible] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const channelId = currentChannel?.id;

  useEffect(() => {
    if (!channelId) return;
    setVisible(true);
    setNow(Date.now());
    const hide = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(hide);
  }, [channelId, currentEmbedIndex, infoTick]);

  // Mantém a linha de progresso em dia enquanto a barra está na tela
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [visible]);

  if (!currentChannel) return null;

  const current = currentChannel.epg?.current;
  const next = currentChannel.epg?.next;
  const progress = progressOf(current, now);
  const title = current?.title || currentChannel.description || currentChannel.category;

  return (
    <div className={`epg-bar ${visible ? 'epg-bar-show' : ''}`}>
      {currentChannel.logo_url && (
        <img className="epg-logo" src={currentChannel.logo_url} alt="" referrerPolicy="no-referrer" />
      )}

      <div className="epg-block epg-now">
        <div className="epg-label">
          <span className="epg-dot" /> Agora · {currentChannel.name}
        </div>
        <div className="epg-title">{title}</div>
        <div className="epg-meta">{timeLabel(current)}</div>
        {progress !== null && (
          <div className="epg-track">
            <div className="epg-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </div>

      {next && (
        <div className="epg-block epg-next">
          <div className="epg-label">A seguir</div>
          <div className="epg-title epg-title-small">{next.title}</div>
          <div className="epg-meta">{timeLabel(next)}</div>
        </div>
      )}
    </div>
  );
}
