const API_BASE = 'https://api.reidoscanais.im';

export interface EmbedItem {
  provider: string;
  quality: string;
  embed_url: string;
}

export interface EpgProgram {
  title: string;
  description?: string;
  formatted_time?: string;
  start_time?: number;
  end_time?: number;
  image?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  logo_url: string;
  category: string;
  embeds: EmbedItem[];
  epg?: {
    current?: EpgProgram;
    next?: EpgProgram;
  };
}

export interface SportEvent {
  id: string;
  title: string;
  description: string;
  poster: string;
  category: string;
  competition: string;
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  start_time: string;
  start_timestamp: number;
  status: string;
  popular: boolean;
  embeds: EmbedItem[];
}

export const ChannelRepository = {
  async getChannels(): Promise<Channel[]> {
    try {
      const res = await fetch(`${API_BASE}/channels`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      console.error('Erro ao buscar canais:', e);
      return [];
    }
  },

  async getLiveSports(): Promise<SportEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/sports?status=live`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      console.error('Erro ao buscar esportes ao vivo:', e);
      return [];
    }
  },

  // Jogos de hoje (ao vivo e agendados). Se a rota sem filtro falhar, cai para só os ao vivo
  async getSportsToday(): Promise<SportEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/sports`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) return json.data;
    } catch (e) {
      console.error('Erro ao buscar jogos de hoje:', e);
    }
    return ChannelRepository.getLiveSports();
  },

  async search(query: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      return json.success ? json.data : { channels: [], events: [] };
    } catch (e) {
      console.error('Erro na busca:', e);
      return { channels: [], events: [] };
    }
  }
};
