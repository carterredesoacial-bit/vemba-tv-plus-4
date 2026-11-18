import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useInputController } from '../input/useInputController';
import { Splash } from '../components/Splash';
import { SideMenu } from '../components/SideMenu';
import { TopBar } from '../components/TopBar';
import { InicioScreen } from '../screens/InicioScreen';
import { TvScreen } from '../screens/TvScreen';
import { SportsScreen } from '../screens/SportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VolumeRing } from '../components/VolumeRing';
import { ChannelMenu } from '../components/ChannelMenu';
import { EventsOverlay } from '../components/EventsOverlay';
import { Toast, CountdownOverlay, RadioPrompt } from '../components/Overlays';
import { useScheduleWatcher } from './useScheduleWatcher';

// Relógio isolado: atualiza sozinho sem re-renderizar o app inteiro
function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ color: '#00f0ff', fontSize: '18px', fontWeight: 'bold' }}>
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const activeTab = useAppStore((s) => s.activeTab);
  const fetchData = useAppStore((s) => s.fetchData);

  // Ativa o motor de Comando (Xbox/PS) e Teclado em toda a aplicação
  useInputController();
  useScheduleWatcher();

  useEffect(() => {
    // Os dados carregam já, em paralelo com o splash
    fetchData();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    // Atualiza a programação de 5 em 5 minutos
    const refresh = setInterval(() => useAppStore.getState().refreshChannels(), 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [fetchData]);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <SideMenu />
        <div className="app-content">
          {activeTab === 'home' && <InicioScreen />}
          {activeTab === 'tv' && <TvScreen />}
          {activeTab === 'sports' && <SportsScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </div>
      </div>

      {/* Anel de volume por cima de tudo, inclusive do ecrã inteiro */}
      <VolumeRing />
      <ChannelMenu />
      <EventsOverlay />
      <CountdownOverlay />
      <RadioPrompt />
      <Toast />
    </div>
  );
}
