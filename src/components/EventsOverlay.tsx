import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fmtClock } from '../api/epgTime';

function defaultWhen(): string {
  const d = new Date(Date.now() + 3600 * 1000);
  d.setMinutes(0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Formulário para adicionar um evento na mão (precisa de teclado)
function EventForm() {
  const addManualEvent = useAppStore((s) => s.addManualEvent);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(defaultWhen);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const t = title.trim();
    const ms = new Date(when).getTime();
    const l = link.trim();
    if (!t) { setError('Põe o nome do evento.'); return; }
    if (!Number.isFinite(ms)) { setError('Põe a data e a hora.'); return; }
    if (l && !/^https:\/\//i.test(l)) { setError('O link tem que começar com https://'); return; }
    addManualEvent(t, ms, l || undefined);
  };

  return (
    <div
      className="ev-form"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          save();
        }
      }}>
      <h3>Adicionar evento</h3>
      <label>
        Nome
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Girabola, Petro x 1º de Agosto" />
      </label>
      <label>
        Data e hora
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </label>
      <label>
        Link da transmissão (opcional, https)
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
      </label>
      {error && <div className="ev-error">{error}</div>}
      <div className="ev-form-btns">
        <button onClick={save}>Guardar</button>
        <button className="ev-cancel" onClick={() => setOverlay('events')}>Cancelar</button>
      </div>
      <div className="ev-hint">Enter guarda  |  Esc volta</div>
    </div>
  );
}

// Janela de Eventos Desportivos (Start)
export function EventsOverlay() {
  const overlay = useAppStore((s) => s.overlay);
  const items = useAppStore((s) => s.eventItems);
  const focus = useAppStore((s) => s.eventsFocus);
  const loading = useAppStore((s) => s.eventsLoading);
  const setEventsFocus = useAppStore((s) => s.setEventsFocus);
  const activateEvent = useAppStore((s) => s.activateEvent);
  const removeManualEvent = useAppStore((s) => s.removeManualEvent);
  const setOverlay = useAppStore((s) => s.setOverlay);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const open = overlay === 'events' || overlay === 'eventForm';

  useEffect(() => {
    if (overlay !== 'events') return;
    const el = rowRefs.current[focus];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [overlay, focus]);

  if (!open) return null;

  return (
    <div className="ev-backdrop" onClick={() => setOverlay('none')}>
      <div className="ev-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ev-head">
          <h2>Eventos Desportivos</h2>
          <span>Hoje</span>
        </div>

        {overlay === 'eventForm' ? (
          <EventForm />
        ) : (
          <>
            <div className="ev-list">
              <div
                ref={(el) => { rowRefs.current[0] = el; }}
                className={`ev-row ev-add ${focus === 0 ? 'focused-item' : ''}`}
                onClick={() => { setEventsFocus(0); activateEvent(0); }}>
                + Evento (adicionar à mão)
              </div>

              {items.map((it, i) => (
                <div
                  key={it.id}
                  ref={(el) => { rowRefs.current[i + 1] = el; }}
                  className={`ev-row ${focus === i + 1 ? 'focused-item' : ''}`}
                  onClick={() => { setEventsFocus(i + 1); activateEvent(i + 1); }}>
                  <span className={`ev-badge ${it.live ? 'ev-live' : 'ev-sched'}`}>
                    {it.live ? 'AO VIVO' : 'AGENDADO'}
                  </span>
                  <span className="ev-time">{it.startMs ? fmtClock(it.startMs) : '--:--'}</span>
                  <div className="ev-main">
                    <b>{it.title}</b>
                    <small>{it.competition}</small>
                  </div>
                  {it.manual && (
                    <button
                      className="ev-del"
                      title="Remover"
                      onClick={(e) => { e.stopPropagation(); removeManualEvent(it.manual!.id); }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {!loading && items.length === 0 && (
                <div className="ev-empty">Sem jogos para hoje por agora.</div>
              )}
              {loading && <div className="ev-empty">A carregar jogos...</div>}
            </div>
            <div className="ev-hint">▲ ▼ Escolher  |  A Assistir  |  Start ou B Fechar</div>
          </>
        )}
      </div>
    </div>
  );
}
