import { EpgProgram } from './channelRepository';

// A API manda o tempo em segundos (10 dígitos); aceita também milissegundos
export function toMs(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return value > 1e12 ? value : value * 1000;
}

export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// A API manda formatted_time em hora de Brasília e em texto comprido, então só serve
// de reserva. O normal é calcular a hora a partir dos timestamps, no fuso do aparelho.
export function timeLabel(p?: EpgProgram): string {
  if (!p) return '';
  const s = toMs(p.start_time);
  const e = toMs(p.end_time);
  if (s && e) return `${fmtClock(s)} - ${fmtClock(e)}`;
  return p.formatted_time || '';
}

export function progressOf(p: EpgProgram | undefined, now: number): number | null {
  const s = toMs(p?.start_time);
  const e = toMs(p?.end_time);
  if (!s || !e || e <= s) return null;
  return Math.max(0, Math.min(1, (now - s) / (e - s)));
}
