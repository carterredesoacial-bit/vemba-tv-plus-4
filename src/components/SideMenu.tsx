import React from 'react';
import { useAppStore, TabId, TABS } from '../store/useAppStore';
import { IconHome, IconTv, IconSports, IconGuide, IconRadio } from './icons';

interface MenuItem {
  id: TabId | null; // null = ainda não existe
  label: string;
  icon: React.ReactNode;
}

const ITEMS: MenuItem[] = [
  { id: 'home', label: 'Início', icon: <IconHome /> },
  { id: 'tv', label: 'TV Direto', icon: <IconTv /> },
  { id: 'sports', label: 'Esportes', icon: <IconSports /> },
  { id: null, label: 'Guia TV', icon: <IconGuide /> },
  { id: null, label: 'Rádios', icon: <IconRadio /> }
];

export function SideMenu() {
  const activeTab = useAppStore((s) => s.activeTab);
  const focusZone = useAppStore((s) => s.focusZone);
  const sidebarIndex = useAppStore((s) => s.sidebarIndex);
  const liveCount = useAppStore((s) => s.liveSports.length);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setFocusZone = useAppStore((s) => s.setFocusZone);

  return (
    <nav className="sidemenu">
      {ITEMS.map((item) => {
        if (item.id === null) {
          return (
            <div key={item.label} className="menu-item menu-item-soon">
              {item.icon}
              <span>{item.label}</span>
              <span className="soon-tag">Em breve</span>
            </div>
          );
        }

        const tabId = item.id;
        const isActive = activeTab === tabId;
        const isFocused = focusZone === 'sidebar' && sidebarIndex === TABS.indexOf(tabId);

        return (
          <button
            key={item.label}
            className={`menu-item ${isActive ? 'menu-item-active' : ''} ${isFocused ? 'focused-item' : ''}`}
            onClick={() => {
              setActiveTab(tabId);
              setFocusZone('list');
            }}>
            {item.icon}
            <span>{item.label}</span>
            {tabId === 'sports' && liveCount > 0 && <span className="menu-badge">{liveCount}</span>}
          </button>
        );
      })}
    </nav>
  );
}
