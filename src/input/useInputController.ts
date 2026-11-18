import { useEffect } from 'react';
import { useAppStore, TABS, getHomeChannels } from '../store/useAppStore';

type Action =
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OK' | 'BACK'
  | 'CH_UP' | 'CH_DOWN'
  | 'VOL_UP' | 'VOL_DOWN' | 'MUTE'
  | 'FAV' | 'FULLSCREEN' | 'INFO'
  | 'SELECT_SHORT' | 'SELECT_LONG' | 'START_SHORT' | 'START_LONG';

const REPEAT_FIRST_MS = 380; // Tempo segurando a direção antes de começar a repetir
const REPEAT_NEXT_MS = 140; // Intervalo entre repetições
const VOLUME_STEP = 5; // Quanto o volume muda a cada aperto
const VOLUME_REPEAT_MS = 130; // Segurando o gatilho, repete neste intervalo
const HOLD_MS = 3000; // Segurar Select/Start por este tempo = ação longa

function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

// Distingue toque curto de "segurar": a ação longa dispara assim que o tempo passa
function makeHold(onShort: () => void, onLong: () => void) {
  let timer: number | null = null;
  let pressed = false;
  let fired = false;
  return {
    press() {
      if (pressed) return;
      pressed = true;
      fired = false;
      timer = window.setTimeout(() => {
        fired = true;
        timer = null;
        onLong();
      }, HOLD_MS);
    },
    release() {
      if (!pressed) return;
      pressed = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (!fired) onShort();
    },
    cancel() {
      pressed = false;
      fired = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}

function runAction(action: Action) {
  const s = useAppStore.getState();

  // Volume e mudo funcionam sempre
  if (action === 'VOL_UP') { s.adjustVolume(VOLUME_STEP); return; }
  if (action === 'VOL_DOWN') { s.adjustVolume(-VOLUME_STEP); return; }
  if (action === 'MUTE') { s.toggleMute(); return; }

  // 1. Contagem da troca agendada: A vai agora, B cancela
  if (s.countdown) {
    if (action === 'OK') s.finishCountdown();
    else if (action === 'BACK') s.cancelCountdown();
    return;
  }

  // 2. Pergunta das Rádios
  if (s.radioPrompt) {
    if (action === 'OK') {
      s.setRadioPrompt(false);
      s.showToast('As Rádios chegam em breve');
    } else if (action === 'BACK' || action === 'SELECT_SHORT') {
      s.setRadioPrompt(false);
    }
    return;
  }

  // 3. Formulário de evento: só o B fecha (o resto é digitado no teclado)
  if (s.overlay === 'eventForm') {
    if (action === 'BACK') s.setOverlay('events');
    return;
  }

  // 4. Janela de Eventos Desportivos (Start)
  if (s.overlay === 'events') {
    const total = s.eventItems.length + 1; // +1 da linha "+ Evento"
    if (action === 'UP') s.setEventsFocus(wrap(s.eventsFocus - 1, total));
    else if (action === 'DOWN') s.setEventsFocus(wrap(s.eventsFocus + 1, total));
    else if (action === 'OK') s.activateEvent(s.eventsFocus);
    else if (action === 'BACK' || action === 'START_SHORT') s.setOverlay('none');
    return;
  }

  // 5. Menu de canais por cima do vídeo (Select)
  if (s.overlay === 'channels') {
    const n = s.channels.length;
    if (n === 0) {
      s.setOverlay('none');
      return;
    }
    const ch = s.channels[s.channelFocusIndex];
    switch (action) {
      case 'LEFT':
        s.setChannelFocusIndex(wrap(s.channelFocusIndex - 1, n));
        s.setMenuSub(0);
        break;
      case 'RIGHT':
        s.setChannelFocusIndex(wrap(s.channelFocusIndex + 1, n));
        s.setMenuSub(0);
        break;
      case 'UP':
        s.setMenuSub(0);
        break;
      case 'DOWN':
        if (ch?.epg?.next) s.setMenuSub(1);
        break;
      case 'OK':
        s.activateMenu();
        break;
      case 'START_SHORT':
        // Agenda a troca para a hora em que o programa seguinte começa
        s.scheduleNext(s.channelFocusIndex);
        s.setOverlay('none');
        break;
      case 'FAV':
      case 'FULLSCREEN': // com o menu aberto o Y serve para favoritar
        if (ch) s.toggleFavorite(ch.id);
        break;
      case 'CH_UP':
        s.nextChannel();
        s.setMenuSub(0);
        break;
      case 'CH_DOWN':
        s.prevChannel();
        s.setMenuSub(0);
        break;
      case 'BACK':
      case 'SELECT_SHORT':
        s.setOverlay('none');
        break;
    }
    return;
  }

  // 6. Nenhuma janela aberta: botões centrais e atalhos
  switch (action) {
    case 'SELECT_SHORT': s.openChannels(); return;
    case 'SELECT_LONG': s.setRadioPrompt(true); return;
    case 'START_SHORT': void s.openEvents(); return;
    case 'START_LONG':
      s.setFullscreenPlayer(false);
      s.setActiveTab('settings');
      s.setFocusZone('list');
      return;
    case 'INFO':
      if (s.activeTab === 'tv') s.bumpInfo();
      return;
    case 'FULLSCREEN':
      if (s.activeTab === 'tv') s.setFullscreenPlayer(!s.isFullscreenPlayer);
      return;
  }

  // Troca direta de canal com LB/RB, Q/E ou PageUp/PageDown
  if (action === 'CH_UP') {
    s.nextChannel();
    return;
  }
  if (action === 'CH_DOWN') {
    s.prevChannel();
    return;
  }

  // Ecrã inteiro: B sai; Baixo troca de servidor
  if (s.isFullscreenPlayer) {
    if (action === 'BACK') {
      s.setFullscreenPlayer(false);
    } else if (action === 'DOWN') {
      const count = s.currentChannel?.embeds?.length ?? 0;
      if (count > 1) s.setEmbedIndex(wrap(s.currentEmbedIndex + 1, count));
    }
    return;
  }

  // Menu lateral
  if (s.focusZone === 'sidebar') {
    if (action === 'UP') {
      const nextIdx = wrap(s.sidebarIndex - 1, TABS.length);
      s.setSidebarIndex(nextIdx);
      s.setActiveTab(TABS[nextIdx]);
    } else if (action === 'DOWN') {
      const nextIdx = wrap(s.sidebarIndex + 1, TABS.length);
      s.setSidebarIndex(nextIdx);
      s.setActiveTab(TABS[nextIdx]);
    } else if (action === 'RIGHT' || action === 'OK') {
      s.setFocusZone('list');
    }
    return;
  }

  // Conteúdo: na fileira do Início Esquerda anda para o canal da esquerda; só no primeiro volta ao menu
  const homeCanMoveLeft = s.activeTab === 'home' && s.homeFocusIndex > 0;
  if (action === 'BACK' || (action === 'LEFT' && !homeCanMoveLeft)) {
    s.setFocusZone('sidebar');
    return;
  }

  if (s.activeTab === 'tv') {
    if (s.channels.length === 0) return;
    if (action === 'UP') {
      s.setChannelFocusIndex(wrap(s.channelFocusIndex - 1, s.channels.length));
    } else if (action === 'DOWN') {
      s.setChannelFocusIndex(wrap(s.channelFocusIndex + 1, s.channels.length));
    } else if (action === 'FAV') {
      const target = s.channels[s.channelFocusIndex];
      if (target) s.toggleFavorite(target.id);
    } else if (action === 'OK') {
      const target = s.channels[s.channelFocusIndex];
      if (!target) return;
      if (s.currentChannel?.id === target.id) {
        // Já está no canal selecionado: entra em ecrã inteiro
        s.setFullscreenPlayer(true);
      } else {
        s.setChannel(target, 0);
      }
    }
    return;
  }

  if (s.activeTab === 'home') {
    const row = getHomeChannels(s.channels, s.favoriteIds);
    if (row.length === 0) return;
    const idx = Math.min(s.homeFocusIndex, row.length - 1);
    if (action === 'LEFT') {
      s.setHomeFocusIndex(Math.max(0, idx - 1));
    } else if (action === 'RIGHT') {
      s.setHomeFocusIndex(Math.min(row.length - 1, idx + 1));
    } else if (action === 'OK') {
      const target = row[idx];
      if (target) {
        s.setChannel(target, 0);
        s.setActiveTab('tv');
      }
    }
    return;
  }

  if (s.activeTab === 'sports') {
    const count = s.liveSports.length;
    if (count === 0) return;
    if (action === 'UP') {
      s.setSportFocusIndex(wrap(s.sportFocusIndex - 1, count));
    } else if (action === 'DOWN') {
      s.setSportFocusIndex(wrap(s.sportFocusIndex + 1, count));
    } else if (action === 'OK') {
      const target = s.liveSports[s.sportFocusIndex];
      if (target) s.playSport(target, 0);
    }
  }
  // Definições: sem itens focáveis; Esquerda/Voltar já tratados acima
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

export function useInputController() {
  useEffect(() => {
    const selectHold = makeHold(
      () => runAction('SELECT_SHORT'),
      () => runAction('SELECT_LONG')
    );
    const startHold = makeHold(
      () => runAction('START_SHORT'),
      () => runAction('START_LONG')
    );

    // 1. Teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escrevendo num campo (formulário de evento): não rouba as teclas
      if (isTyping(e.target)) {
        if (e.key === 'Escape') runAction('BACK');
        return;
      }

      // V = Select, Espaço = Start (toque curto ou segurar)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (!e.repeat) selectHold.press();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) startHold.press();
        return;
      }

      let action: Action | null = null;
      switch (e.key) {
        case 'ArrowUp': action = 'UP'; break;
        case 'ArrowDown': action = 'DOWN'; break;
        case 'ArrowLeft': action = 'LEFT'; break;
        case 'ArrowRight': action = 'RIGHT'; break;
        case 'Enter': action = 'OK'; break;
        case 'Escape':
        case 'Backspace':
        case 'd':
        case 'D': action = 'BACK'; break;
        case 'PageUp':
        case 'e':
        case 'E': action = 'CH_UP'; break;
        case 'PageDown':
        case 'q':
        case 'Q': action = 'CH_DOWN'; break;
        case '+':
        case '=':
        case 'AudioVolumeUp': action = 'VOL_UP'; break;
        case '-':
        case '_':
        case 'AudioVolumeDown': action = 'VOL_DOWN'; break;
        case 'm':
        case 'M':
        case 'AudioVolumeMute': action = 'MUTE'; break;
        case 'f':
        case 'F': action = 'FAV'; break;
        case 'w':
        case 'W': action = 'FULLSCREEN'; break;
        case 'i':
        case 'I': action = 'INFO'; break;
      }
      if (!action) return;
      e.preventDefault();
      // Segurar estas teclas não deve repetir a ação
      const once: Action[] = ['OK', 'BACK', 'MUTE', 'FAV', 'FULLSCREEN', 'INFO'];
      if (e.repeat && once.includes(action)) return;
      runAction(action);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        selectHold.release();
      } else if (e.key === ' ') {
        e.preventDefault();
        startHold.release();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 2. Gamepad API (Xbox / PlayStation / genéricos)
    const onGamepadConnected = () => useAppStore.getState().setGamepadConnected(true);
    const onGamepadDisconnected = () => useAppStore.getState().setGamepadConnected(false);
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    // Botões de ação só disparam no instante em que são apertados (borda de subida)
    const prev = { a: false, b: false, x: false, y: false, lb: false, rb: false, l3: false, select: false, start: false };
    // Direções disparam ao apertar e repetem depois de um pequeno atraso
    let heldDir: Action | null = null;
    let heldSince = 0;
    let lastFire = 0;
    let lastVolumeFire = 0;
    let animFrameId = 0;

    const pollGamepad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let connected = false;
      const cur = { a: false, b: false, x: false, y: false, lb: false, rb: false, l3: false, select: false, start: false };
      let up = false, down = false, left = false, right = false;
      let volUp = false, volDown = false;

      for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp) continue;
        connected = true;

        // Standard Gamepad: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 10 L3, 12-15 D-Pad
        cur.a = cur.a || !!gp.buttons[0]?.pressed;
        cur.b = cur.b || !!gp.buttons[1]?.pressed;
        cur.x = cur.x || !!gp.buttons[2]?.pressed;
        cur.y = cur.y || !!gp.buttons[3]?.pressed;
        cur.lb = cur.lb || !!gp.buttons[4]?.pressed;
        cur.rb = cur.rb || !!gp.buttons[5]?.pressed;
        cur.select = cur.select || !!gp.buttons[8]?.pressed;
        cur.start = cur.start || !!gp.buttons[9]?.pressed;
        cur.l3 = cur.l3 || !!gp.buttons[10]?.pressed;

        // Gatilhos: RT (7) sobe o volume, LT (6) desce
        volUp = volUp || !!gp.buttons[7]?.pressed;
        volDown = volDown || !!gp.buttons[6]?.pressed;

        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;
        up = up || !!gp.buttons[12]?.pressed || axisY < -0.55;
        down = down || !!gp.buttons[13]?.pressed || axisY > 0.55;
        left = left || !!gp.buttons[14]?.pressed || axisX < -0.55;
        right = right || !!gp.buttons[15]?.pressed || axisX > 0.55;
      }

      const store = useAppStore.getState();
      if (connected !== store.gamepadConnected) store.setGamepadConnected(connected);

      if (cur.a && !prev.a) runAction('OK');
      if (cur.b && !prev.b) runAction('BACK');
      if (cur.x && !prev.x) runAction('MUTE');
      if (cur.y && !prev.y) runAction('FULLSCREEN');
      if (cur.lb && !prev.lb) runAction('CH_DOWN');
      if (cur.rb && !prev.rb) runAction('CH_UP');
      if (cur.l3 && !prev.l3) runAction('INFO');
      if (cur.select && !prev.select) selectHold.press();
      if (!cur.select && prev.select) selectHold.release();
      if (cur.start && !prev.start) startHold.press();
      if (!cur.start && prev.start) startHold.release();
      Object.assign(prev, cur);

      const now = performance.now();
      if ((volUp || volDown) && !(volUp && volDown) && now - lastVolumeFire > VOLUME_REPEAT_MS) {
        lastVolumeFire = now;
        runAction(volUp ? 'VOL_UP' : 'VOL_DOWN');
      }

      const dir: Action | null = up ? 'UP' : down ? 'DOWN' : left ? 'LEFT' : right ? 'RIGHT' : null;
      if (dir) {
        if (dir !== heldDir) {
          heldDir = dir;
          heldSince = now;
          lastFire = now;
          runAction(dir);
        } else {
          const st = useAppStore.getState();
          // Em ecrã inteiro sem janela aberta não repete (evita trocas descontroladas de servidor)
          const canRepeat = !(st.isFullscreenPlayer && st.overlay === 'none');
          if (canRepeat && now - heldSince > REPEAT_FIRST_MS && now - lastFire > REPEAT_NEXT_MS) {
            lastFire = now;
            runAction(dir);
          }
        }
      } else {
        heldDir = null;
      }

      animFrameId = requestAnimationFrame(pollGamepad);
    };

    animFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      cancelAnimationFrame(animFrameId);
      selectHold.cancel();
      startHold.cancel();
    };
  }, []);
}
