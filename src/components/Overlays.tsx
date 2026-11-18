import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

// Aviso curto no topo da tela
export function Toast() {
  const text = useAppStore((s) => s.toastText);
  const tick = useAppStore((s) => s.toastTick);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tick === 0) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(id);
  }, [tick]);

  return <div className={`toast ${visible ? 'toast-show' : ''}`}>{text}</div>;
}

// Contagem de 15 segundos antes da troca agendada: A vai agora, B cancela
export function CountdownOverlay() {
  const countdown = useAppStore((s) => s.countdown);
  const finish = useAppStore((s) => s.finishCountdown);
  const cancel = useAppStore((s) => s.cancelCountdown);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!countdown) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [countdown]);

  if (!countdown) return null;
  const secs = Math.max(0, Math.ceil((countdown.endsAt - now) / 1000));

  return (
    <div className="cd-box">
      <div className="cd-label">Vai mudar para</div>
      <div className="cd-title">{countdown.schedule.programTitle}</div>
      <div className="cd-channel">{countdown.schedule.channelName}</div>
      <div className="cd-secs">{secs}s</div>
      <div className="cd-btns">
        <button onClick={finish}>A  Ir agora</button>
        <button className="cd-cancel" onClick={cancel}>B  Cancelar</button>
      </div>
    </div>
  );
}

// Select segurado: pergunta se quer ir às Rádios
export function RadioPrompt() {
  const open = useAppStore((s) => s.radioPrompt);
  const setOpen = useAppStore((s) => s.setRadioPrompt);
  const showToast = useAppStore((s) => s.showToast);

  if (!open) return null;

  return (
    <div className="cd-box">
      <div className="cd-title">Ir para as Rádios em Direto?</div>
      <div className="cd-channel">As Rádios ainda estão em breve.</div>
      <div className="cd-btns">
        <button onClick={() => { setOpen(false); showToast('As Rádios chegam em breve'); }}>A  Sim</button>
        <button className="cd-cancel" onClick={() => setOpen(false)}>B  Não</button>
      </div>
    </div>
  );
}
