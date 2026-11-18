import React, { useEffect, useState } from 'react';

interface PadInfo {
  id: string;
  mapping: string;
  pressed: number[];
  axes: string[];
}

// Painel de teste do comando: mostra o modelo e quais botões estão apertados
export function GamepadTest() {
  const [pads, setPads] = useState<PadInfo[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const list = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const info: PadInfo[] = [];
      for (const gp of list) {
        if (!gp) continue;
        const pressed: number[] = [];
        gp.buttons.forEach((b, i) => { if (b.pressed) pressed.push(i); });
        info.push({
          id: gp.id,
          mapping: gp.mapping || 'desconhecido',
          pressed,
          axes: gp.axes.map((a) => a.toFixed(2))
        });
      }
      setPads(info);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ backgroundColor: '#131b2e', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
      <h3 style={{ color: '#00f0ff', margin: '0 0 10px 0' }}>Teste do comando</h3>
      {pads.length === 0 ? (
        <p style={{ margin: 0 }}>Aperta qualquer botão do comando para ele aparecer aqui.</p>
      ) : (
        pads.map((p, i) => (
          <div key={i} style={{ fontSize: '13px', lineHeight: 1.7 }}>
            <div><strong>Modelo:</strong> {p.id}</div>
            <div>
              <strong>Mapeamento:</strong> {p.mapping}
              {p.mapping !== 'standard' && ' (fora do padrão: os números dos botões podem ser outros)'}
            </div>
            <div><strong>Botões apertados:</strong> {p.pressed.length ? p.pressed.join(', ') : 'nenhum'}</div>
            <div><strong>Analógicos:</strong> {p.axes.join('  |  ')}</div>
          </div>
        ))
      )}
      <p style={{ fontSize: '12px', margin: '10px 0 0 0' }}>
        Padrão Xbox: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 10 L3, 11 R3, 12 a 15 setas.
      </p>
    </div>
  );
}
