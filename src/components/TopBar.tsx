import React, { useEffect, useState } from 'react';
import { useAppStore, TABS } from '../store/useAppStore';
import { IconLogo, IconSearch, IconBell, IconGear } from './icons';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Relógio isolado: atualiza sozinho sem re-renderizar o app inteiro
function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <div className="topbar-clock">
      <div className="topbar-time">{hh}:{mm}</div>
      <div className="topbar-date">
        {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
      </div>
    </div>
  );
}

export function TopBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const focusZone = useAppStore((s) => s.focusZone);
  const sidebarIndex = useAppStore((s) => s.sidebarIndex);
  const gamepadConnected = useAppStore((s) => s.gamepadConnected);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setFocusZone = useAppStore((s) => s.setFocusZone);

  const settingsIndex = TABS.indexOf('settings');
  const gearFocused = focusZone === 'sidebar' && sidebarIndex === settingsIndex;

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <IconLogo size={50} />
        <div className="topbar-name">
          VEMBA <span>TV Plus</span>
        </div>
      </div>

      <div className="topbar-right">
        {gamepadConnected && <span className="topbar-pad" title="Comando ligado">🎮</span>}

        {/* Ainda sem tela nem dados: ficam apagados até existirem */}
        <div className="topbar-btn topbar-btn-soon" title="Em breve">
          <IconSearch size={26} />
          <span>Pesquisar</span>
        </div>
        <div className="topbar-btn topbar-btn-soon" title="Em breve">
          <IconBell size={26} />
          <span>Notificações</span>
        </div>

        <button
          className={`topbar-btn ${activeTab === 'settings' ? 'topbar-btn-active' : ''} ${gearFocused ? 'focused-item' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            setFocusZone('list');
          }}>
          <IconGear size={26} />
          <span>Definições</span>
        </button>

        <div className="topbar-sep" />
        <Clock />
      </div>
    </div>
  );
}
