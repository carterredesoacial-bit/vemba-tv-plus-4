import { useEffect } from 'react';
import { useAppStore, COUNTDOWN_MS } from '../store/useAppStore';

// Vigia as trocas agendadas: 15 segundos antes do programa começar, inicia a contagem
export function useScheduleWatcher() {
  useEffect(() => {
    const id = setInterval(() => {
      const s = useAppStore.getState();
      const now = Date.now();
      if (s.countdown) {
        if (now >= s.countdown.endsAt) s.finishCountdown();
        return;
      }
      const due = s.schedules.find((x) => x.startMs - now <= COUNTDOWN_MS);
      if (due) s.beginCountdown(due);
    }, 1000);
    return () => clearInterval(id);
  }, []);
}
