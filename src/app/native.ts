// Ponte opcional com a parte nativa do app (Electron no Windows, WebView no Android).
// O iframe do player é de outro site, então o navegador NÃO deixa o app mexer no volume dele.
// Quando o app for empacotado, a casca nativa pode expor window.vembaNative.setVolume
// para mexer no volume de verdade. Se não existir, o anel só mostra o valor.
declare global {
  interface Window {
    vembaNative?: {
      setVolume?: (percent: number, muted: boolean) => void;
    };
  }
}

const STORAGE_KEY = 'vemba.volume';

export function loadVolume(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw === null ? NaN : Number(raw);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  } catch {
    // sem localStorage, segue com o padrão
  }
  return 50;
}

export function applyVolume(percent: number, muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(percent));
  } catch {
    // ignora
  }
  try {
    window.vembaNative?.setVolume?.(percent, muted);
  } catch (e) {
    console.error('Erro na ponte nativa de volume:', e);
  }
}

export {};
