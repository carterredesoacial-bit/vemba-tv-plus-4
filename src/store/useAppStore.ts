import { create } from 'zustand';
import { Channel, SportEvent, ChannelRepository } from '../api/channelRepository';
import { loadVolume, applyVolume } from '../app/native';
import { toMs, fmtClock } from '../api/epgTime';

// ---------- Armazenamento local ----------
const FAV_KEY = 'vemba.favorites';
const MANUAL_KEY = 'vemba.manualEvents';

function loadJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem localStorage, segue sem guardar
  }
}

function loadFavorites(): string[] {
  const list = loadJson(FAV_KEY);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

function loadManualEvents(): ManualEvent[] {
  const list = loadJson(MANUAL_KEY);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (x): x is ManualEvent =>
      !!x && typeof x.id === 'string' && typeof x.title === 'string' && typeof x.startMs === 'number'
  );
}

// ---------- Tipos ----------
export type TabId = 'home' | 'tv' | 'sports' | 'settings';
export type FocusZone = 'sidebar' | 'list';
export type Overlay = 'none' | 'channels' | 'events' | 'eventForm';

export const TABS: TabId[] = ['home', 'tv', 'sports', 'settings'];
export const COUNTDOWN_MS = 15000;

export interface Schedule {
  id: string;
  channelId: string;
  channelName: string;
  programTitle: string;
  startMs: number;
}

export interface Countdown {
  schedule: Schedule;
  endsAt: number;
}

export interface ManualEvent {
  id: string;
  title: string;
  startMs: number;
  embedUrl?: string;
}

export interface EventItem {
  id: string;
  title: string;
  competition: string;
  startMs: number;
  live: boolean;
  source: 'api' | 'manual';
  sport?: SportEvent;
  manual?: ManualEvent;
}

// Canais da fileira do Início: os favoritos, ou os 6 primeiros enquanto não houver nenhum
export function getHomeChannels(channels: Channel[], favoriteIds: string[]): Channel[] {
  const favs = favoriteIds
    .map((id) => channels.find((c) => c.id === id))
    .filter((c): c is Channel => !!c)
    .slice(0, 12);
  return favs.length > 0 ? favs : channels.slice(0, 6);
}

// Junta os jogos de hoje da API com os eventos que a pessoa adicionou
function buildEventItems(sports: SportEvent[], manual: ManualEvent[]): EventItem[] {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sod = startOfDay.getTime();
  const eod = sod + 24 * 3600 * 1000;
  const nowMs = Date.now();
  const items: EventItem[] = [];

  for (const sp of sports) {
    const startMs = toMs(sp.start_timestamp) ?? (Date.parse(sp.start_time) || 0);
    const live = /live|vivo|progress/i.test(sp.status || '');
    if (!live && !(startMs >= sod && startMs < eod)) continue;
    const home = sp.teams?.home?.name;
    const away = sp.teams?.away?.name;
    items.push({
      id: `api-${sp.id}`,
      title: home && away ? `${home} x ${away}` : sp.title,
      competition: sp.competition || sp.category || '',
      startMs,
      live,
      source: 'api',
      sport: sp
    });
  }

  for (const m of manual) {
    if (m.startMs < sod) continue;
    items.push({
      id: `manual-${m.id}`,
      title: m.title,
      competition: 'Evento adicionado por ti',
      startMs: m.startMs,
      live: m.startMs <= nowMs && nowMs < m.startMs + 3 * 3600 * 1000,
      source: 'manual',
      manual: m
    });
  }

  return items.sort((a, b) => a.startMs - b.startMs);
}

interface AppState {
  channels: Channel[];
  liveSports: SportEvent[];
  currentChannel: Channel | null;
  currentEmbedIndex: number;
  activeTab: TabId;
  isLoading: boolean;
  isFullscreenPlayer: boolean;
  gamepadConnected: boolean;

  // Volume (o anel aparece quando volumeRingTick muda)
  volume: number;
  muted: boolean;
  volumeRingTick: number;

  favoriteIds: string[];

  // Janelas por cima do vídeo (Select = canais, Start = eventos)
  overlay: Overlay;
  menuSub: 0 | 1; // 0 = programa de agora, 1 = programa a seguir
  radioPrompt: boolean;
  infoTick: number;

  // Troca agendada com contagem de 15 segundos
  schedules: Schedule[];
  countdown: Countdown | null;

  // Aviso curto no topo da tela
  toastText: string;
  toastTick: number;

  // Eventos desportivos
  eventSports: SportEvent[];
  eventItems: EventItem[];
  eventsFocus: number;
  eventsLoading: boolean;
  manualEvents: ManualEvent[];

  // Navegação por foco (Comando / Teclado)
  focusZone: FocusZone;
  sidebarIndex: number;
  channelFocusIndex: number;
  homeFocusIndex: number;
  sportFocusIndex: number;

  fetchData: () => Promise<void>;
  refreshChannels: () => Promise<void>;
  setChannel: (channel: Channel, embedIndex?: number) => void;
  setChannelByIndex: (index: number) => void;
  playSport: (sport: SportEvent, embedIndex?: number) => void;
  playManual: (event: ManualEvent) => void;
  nextChannel: () => void;
  prevChannel: () => void;
  setEmbedIndex: (index: number) => void;
  setActiveTab: (tab: TabId) => void;
  setFocusZone: (zone: FocusZone) => void;
  setSidebarIndex: (index: number) => void;
  setChannelFocusIndex: (index: number) => void;
  setHomeFocusIndex: (index: number) => void;
  setSportFocusIndex: (index: number) => void;
  setFullscreenPlayer: (full: boolean) => void;
  setGamepadConnected: (connected: boolean) => void;
  adjustVolume: (delta: number) => void;
  toggleMute: () => void;
  toggleFavorite: (id: string) => void;

  setOverlay: (overlay: Overlay) => void;
  setMenuSub: (sub: 0 | 1) => void;
  setRadioPrompt: (open: boolean) => void;
  bumpInfo: () => void;
  showToast: (text: string) => void;

  openChannels: () => void;
  activateMenu: () => void;
  scheduleNext: (channelIndex: number) => void;
  beginCountdown: (schedule: Schedule) => void;
  finishCountdown: () => void;
  cancelCountdown: () => void;

  openEvents: () => Promise<void>;
  setEventsFocus: (index: number) => void;
  activateEvent: (index: number) => void;
  addManualEvent: (title: string, startMs: number, embedUrl?: string) => void;
  removeManualEvent: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  channels: [],
  liveSports: [],
  currentChannel: null,
  currentEmbedIndex: 0,
  activeTab: 'tv',
  isLoading: false,
  isFullscreenPlayer: false,
  gamepadConnected: false,

  volume: loadVolume(),
  muted: false,
  volumeRingTick: 0,

  favoriteIds: loadFavorites(),

  overlay: 'none',
  menuSub: 0,
  radioPrompt: false,
  infoTick: 0,

  schedules: [],
  countdown: null,

  toastText: '',
  toastTick: 0,

  eventSports: [],
  eventItems: [],
  eventsFocus: 0,
  eventsLoading: false,
  manualEvents: loadManualEvents(),

  focusZone: 'list',
  sidebarIndex: 1,
  channelFocusIndex: 0,
  homeFocusIndex: 0,
  sportFocusIndex: 0,

  fetchData: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    const [channels, liveSports] = await Promise.all([
      ChannelRepository.getChannels(),
      ChannelRepository.getLiveSports()
    ]);

    set((s) => ({
      channels,
      liveSports,
      isLoading: false,
      currentChannel: s.currentChannel ?? (channels.length > 0 ? channels[0] : null),
      channelFocusIndex: 0,
      homeFocusIndex: 0,
      sportFocusIndex: 0
    }));
  },

  // Atualiza a programação (EPG) sem mexer no que a pessoa está vendo
  refreshChannels: async () => {
    const channels = await ChannelRepository.getChannels();
    if (channels.length === 0) return;
    set((s) => {
      const cur = s.currentChannel;
      const updated = cur ? channels.find((c) => c.id === cur.id) : undefined;
      return {
        channels,
        currentChannel: updated ?? cur ?? channels[0],
        channelFocusIndex: Math.min(s.channelFocusIndex, channels.length - 1)
      };
    });
  },

  setChannel: (channel, embedIndex = 0) => {
    const idx = get().channels.findIndex((c) => c.id === channel.id);
    set({
      currentChannel: channel,
      currentEmbedIndex: embedIndex,
      channelFocusIndex: idx >= 0 ? idx : get().channelFocusIndex
    });
  },

  setChannelByIndex: (index) => {
    const { channels } = get();
    if (channels.length === 0) return;
    const safeIndex = ((index % channels.length) + channels.length) % channels.length;
    set({
      currentChannel: channels[safeIndex],
      currentEmbedIndex: 0,
      channelFocusIndex: safeIndex
    });
  },

  // Toca um evento esportivo no player da aba TV (usa os embeds do evento)
  playSport: (sport, embedIndex = 0) => {
    if (!sport.embeds || sport.embeds.length === 0) return;
    const asChannel: Channel = {
      id: `sport-${sport.id}`,
      name: sport.title,
      description: sport.description,
      logo_url: sport.poster,
      category: sport.competition,
      embeds: sport.embeds
    };
    set({
      currentChannel: asChannel,
      currentEmbedIndex: embedIndex,
      activeTab: 'tv',
      sidebarIndex: TABS.indexOf('tv'),
      focusZone: 'list'
    });
  },

  // Toca um evento que a pessoa adicionou com link de transmissão
  playManual: (event) => {
    if (!event.embedUrl) return;
    const asChannel: Channel = {
      id: `manual-${event.id}`,
      name: event.title,
      logo_url: '',
      category: 'Evento',
      embeds: [{ provider: 'Link', quality: '', embed_url: event.embedUrl }]
    };
    set({
      currentChannel: asChannel,
      currentEmbedIndex: 0,
      activeTab: 'tv',
      sidebarIndex: TABS.indexOf('tv'),
      focusZone: 'list'
    });
  },

  nextChannel: () => {
    const { channels, currentChannel } = get();
    if (channels.length === 0) return;
    const currentIdx = channels.findIndex((c) => c.id === currentChannel?.id);
    const nextIdx = (currentIdx + 1) % channels.length;
    get().setChannelByIndex(nextIdx);
  },

  prevChannel: () => {
    const { channels, currentChannel } = get();
    if (channels.length === 0) return;
    const currentIdx = channels.findIndex((c) => c.id === currentChannel?.id);
    // Sem canal atual (ou evento esportivo a tocar): volta para o último da lista
    const prevIdx = currentIdx < 0 ? channels.length - 1 : (currentIdx - 1 + channels.length) % channels.length;
    get().setChannelByIndex(prevIdx);
  },

  setEmbedIndex: (index) => set({ currentEmbedIndex: index }),
  setActiveTab: (tab) => set({ activeTab: tab, sidebarIndex: TABS.indexOf(tab) }),
  setFocusZone: (zone) => set({ focusZone: zone }),
  setSidebarIndex: (index) => set({ sidebarIndex: index }),
  setChannelFocusIndex: (index) => set({ channelFocusIndex: index }),
  setHomeFocusIndex: (index) => set({ homeFocusIndex: index }),
  setSportFocusIndex: (index) => set({ sportFocusIndex: index }),
  setFullscreenPlayer: (full) => set({ isFullscreenPlayer: full }),
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),

  adjustVolume: (delta) => {
    const volume = Math.max(0, Math.min(100, get().volume + delta));
    set((s) => ({ volume, muted: false, volumeRingTick: s.volumeRingTick + 1 }));
    applyVolume(volume, false);
  },

  toggleMute: () => {
    const muted = !get().muted;
    set((s) => ({ muted, volumeRingTick: s.volumeRingTick + 1 }));
    applyVolume(get().volume, muted);
  },

  toggleFavorite: (id) => {
    const cur = get().favoriteIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ favoriteIds: next });
    saveJson(FAV_KEY, next);
  },

  setOverlay: (overlay) => set({ overlay }),
  setMenuSub: (sub) => set({ menuSub: sub }),
  setRadioPrompt: (open) => set({ radioPrompt: open }),
  bumpInfo: () => set((s) => ({ infoTick: s.infoTick + 1 })),
  showToast: (text) => set((s) => ({ toastText: text, toastTick: s.toastTick + 1 })),

  // ---------- Select: menu de canais ----------
  openChannels: () => {
    const { channels, currentChannel, channelFocusIndex } = get();
    if (channels.length === 0) {
      get().showToast('Ainda não há canais carregados');
      return;
    }
    const idx = channels.findIndex((c) => c.id === currentChannel?.id);
    set({ overlay: 'channels', menuSub: 0, channelFocusIndex: idx >= 0 ? idx : channelFocusIndex });
  },

  // A no menu: "Agora" assiste, "A seguir" agenda
  activateMenu: () => {
    const { channels, channelFocusIndex, menuSub } = get();
    const ch = channels[channelFocusIndex];
    if (!ch) return;
    if (menuSub === 1 && ch.epg?.next) {
      get().scheduleNext(channelFocusIndex);
      set({ overlay: 'none' });
      return;
    }
    get().setChannel(ch, 0);
    get().setActiveTab('tv');
    set({ overlay: 'none', focusZone: 'list' });
  },

  scheduleNext: (channelIndex) => {
    const ch = get().channels[channelIndex];
    const next = ch?.epg?.next;
    const startMs = toMs(next?.start_time);
    if (!ch || !next || !startMs) {
      get().showToast('Este canal não tem a hora do próximo programa');
      return;
    }
    if (startMs <= Date.now()) {
      get().showToast('Esse programa já começou');
      return;
    }
    const id = `${ch.id}-${startMs}`;
    if (get().schedules.some((s) => s.id === id)) {
      get().showToast('Esse programa já está agendado');
      return;
    }
    const schedule: Schedule = {
      id,
      channelId: ch.id,
      channelName: ch.name,
      programTitle: next.title,
      startMs
    };
    set((s) => ({ schedules: [...s.schedules, schedule] }));
    get().showToast(`Agendado: ${next.title} às ${fmtClock(startMs)} (${ch.name})`);
  },

  // Começa a contagem: chega a zero na hora em que o programa começa
  beginCountdown: (schedule) => {
    set({ countdown: { schedule, endsAt: Math.max(schedule.startMs, Date.now() + 3000) } });
  },

  finishCountdown: () => {
    const cd = get().countdown;
    if (!cd) return;
    const ch = get().channels.find((c) => c.id === cd.schedule.channelId);
    set((s) => ({
      countdown: null,
      schedules: s.schedules.filter((x) => x.id !== cd.schedule.id)
    }));
    if (ch) {
      get().setChannel(ch, 0);
      get().setActiveTab('tv');
      set({ overlay: 'none', focusZone: 'list' });
    }
  },

  cancelCountdown: () => {
    const cd = get().countdown;
    if (!cd) return;
    set((s) => ({
      countdown: null,
      schedules: s.schedules.filter((x) => x.id !== cd.schedule.id)
    }));
    get().showToast('Troca agendada cancelada');
  },

  // ---------- Start: eventos desportivos ----------
  openEvents: async () => {
    set({
      overlay: 'events',
      eventsFocus: 0,
      eventsLoading: true,
      eventItems: buildEventItems(get().eventSports, get().manualEvents)
    });
    const sports = await ChannelRepository.getSportsToday();
    set({
      eventSports: sports,
      eventItems: buildEventItems(sports, get().manualEvents),
      eventsLoading: false
    });
  },

  setEventsFocus: (index) => set({ eventsFocus: index }),

  activateEvent: (index) => {
    if (index === 0) {
      set({ overlay: 'eventForm' });
      return;
    }
    const item = get().eventItems[index - 1];
    if (!item) return;
    if (item.source === 'api' && item.sport?.embeds?.length) {
      get().playSport(item.sport, 0);
      set({ overlay: 'none' });
    } else if (item.source === 'manual' && item.manual?.embedUrl) {
      get().playManual(item.manual);
      set({ overlay: 'none' });
    } else {
      get().showToast('Este evento ainda não tem transmissão');
    }
  },

  addManualEvent: (title, startMs, embedUrl) => {
    const ev: ManualEvent = { id: String(Date.now()), title, startMs, embedUrl };
    const manualEvents = [...get().manualEvents, ev];
    saveJson(MANUAL_KEY, manualEvents);
    set({
      manualEvents,
      overlay: 'events',
      eventsFocus: 0,
      eventItems: buildEventItems(get().eventSports, manualEvents)
    });
    get().showToast('Evento adicionado');
  },

  removeManualEvent: (id) => {
    const manualEvents = get().manualEvents.filter((m) => m.id !== id);
    saveJson(MANUAL_KEY, manualEvents);
    set({
      manualEvents,
      eventsFocus: 0,
      eventItems: buildEventItems(get().eventSports, manualEvents)
    });
  }
}));
