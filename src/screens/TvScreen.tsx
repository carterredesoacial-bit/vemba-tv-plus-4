import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { EpgBar } from '../components/EpgBar';

export function TvScreen() {
  const {
    channels,
    favoriteIds,
    currentChannel,
    currentEmbedIndex,
    setChannel,
    setEmbedIndex,
    focusZone,
    channelFocusIndex,
    isFullscreenPlayer,
    setFullscreenPlayer
  } = useAppStore();

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeEmbed = currentChannel?.embeds?.[currentEmbedIndex]?.embed_url;

  // Auto-scroll suave para manter o canal focado sempre visível ao usar o comando
  useEffect(() => {
    const el = itemRefs.current[channelFocusIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [channelFocusIndex]);

  // Modo Ecrã Inteiro (sem listas nem botões)
  if (isFullscreenPlayer) {
    return (
      <div
        onDoubleClick={() => setFullscreenPlayer(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: '#000'
        }}>
        <div className="clean-player-wrapper">
          {activeEmbed && (
            <iframe
              key={activeEmbed}
              src={activeEmbed}
              className="clean-player-iframe"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="encrypted-media; autoplay"
            />
          )}
          <div className="player-shield" />
          <EpgBar />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flex: 1, height: 'calc(100vh - 70px)', padding: '25px' }}>
      {/* Player Limpo (Zero botões visíveis) */}
      <div
        onDoubleClick={() => setFullscreenPlayer(true)}
        style={{
          flex: 2,
          backgroundColor: '#000',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #1e293b',
          position: 'relative'
        }}>
        <div className="clean-player-wrapper" style={{ flex: 1, minHeight: 0, height: 'auto' }}>
          {activeEmbed ? (
            <iframe
              key={activeEmbed}
              src={activeEmbed}
              className="clean-player-iframe"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="encrypted-media; autoplay"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              A carregar transmissão...
            </div>
          )}
          {/* Escudo que bloqueia cliques/popups e impede a barra do iframe de aparecer */}
          <div className="player-shield" />
          <EpgBar />
        </div>

        {/* Seletor discreto apenas quando existem múltiplos servidores */}
        {currentChannel && currentChannel.embeds && currentChannel.embeds.length > 1 && (
          <div style={{
            padding: '8px 15px',
            backgroundColor: '#131b2e',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            zIndex: 10
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sinal:</span>
            {currentChannel.embeds.map((emb, idx) => (
              <button
                key={idx}
                onClick={() => setEmbedIndex(idx)}
                style={{
                  background: currentEmbedIndex === idx ? '#00f0ff' : '#1e293b',
                  color: currentEmbedIndex === idx ? '#0b0f19' : '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                {emb.provider} ({emb.quality})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista Lateral de Canais */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '5px' }}>
        <h3 style={{ fontSize: '16px', color: '#00f0ff', margin: '0 0 8px 0' }}>Canais de TV</h3>
        {channels.map((ch, idx) => {
          const isPlaying = currentChannel?.id === ch.id;
          const isFocused = focusZone === 'list' && channelFocusIndex === idx;

          return (
            <div
              key={ch.id}
              ref={(el) => { itemRefs.current[idx] = el; }}
              onClick={() => setChannel(ch, 0)}
              className={isFocused ? 'focused-item' : ''}
              style={{
                padding: '12px',
                backgroundColor: isPlaying ? '#1e293b' : '#131b2e',
                border: isPlaying ? '1px solid #00f0ff' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.12s'
              }}>
              {ch.logo_url && <img src={ch.logo_url} alt={ch.name} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{favoriteIds.includes(ch.id) && <span style={{ color: '#fbbf24' }}>★ </span>}{ch.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ch.category}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
