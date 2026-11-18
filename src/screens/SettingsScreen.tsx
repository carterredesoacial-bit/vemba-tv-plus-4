import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { GamepadTest } from '../components/GamepadTest';

export function SettingsScreen() {
  const { gamepadConnected } = useAppStore();

  return (
    <div style={{ flex: 1, padding: '30px', color: '#94a3b8', overflowY: 'auto' }}>
      <h2 style={{ color: '#00f0ff', marginBottom: '20px' }}>Definições do Sistema</h2>
      <div style={{ backgroundColor: '#131b2e', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <p style={{ margin: 0 }}><strong>Aplicação:</strong> VEMBA TV PLUS</p>
        <p style={{ margin: 0 }}><strong>Slogan:</strong> "Assista o que ama, quando e onde quiser"</p>
        <p style={{ margin: 0 }}><strong>Estado do Comando (Xbox/PS):</strong> {gamepadConnected ? 'Conectado e Ativo' : 'Aguardando botão no comando...'}</p>
        <p style={{ margin: 0 }}><strong>Comando:</strong> Setas/Analógico (Navegar) • A (Confirmar) • B (Voltar/Fechar) • X (Mudo) • Y (Ecrã inteiro) • LB/RB (Trocar canal) • LT/RT (Volume) • L3 (Info do programa) • Select (Canais; segurar 3s: Rádios) • Start (Eventos; segurar 3s: Definições) • Baixo no ecrã inteiro (Trocar servidor)</p>
        <p style={{ margin: 0 }}><strong>Teclado:</strong> Setas (Navegar) • Enter (Confirmar) • Esc ou D (Voltar) • Q / E (Canal anterior / seguinte) • − / + (Volume) • M (Mudo) • W (Ecrã inteiro) • I (Info) • V (Select) • Espaço (Start) • F (Favoritar)</p>
      </div>
      <GamepadTest />
    </div>
  );
}
